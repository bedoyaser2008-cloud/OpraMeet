"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { LayoutMode } from "@/lib/constants";

// Hooks
import { usePeerMesh } from "@/hooks/usePeerMesh";
import { useDataChannel } from "@/hooks/useDataChannel";
import { useAudioMeter } from "@/hooks/useAudioMeter";
import { useScreenShare } from "@/hooks/useScreenShare";
import { useBackground } from "@/hooks/useBackground";
import { useBreakoutRooms } from "@/hooks/useBreakoutRooms";
import { usePolls } from "@/hooks/usePolls";
import { useHandRaise } from "@/hooks/useHandRaise";
import { useCaptions } from "@/hooks/useCaptions";
import { useRecording } from "@/hooks/useRecording";
import { useHostControls } from "@/hooks/useHostControls";
import { useLocalMedia } from "@/hooks/useLocalMedia";

// Components
import { RecordingIndicator } from "@/components/meeting/RecordingIndicator";
import { HandRaiseQueue } from "@/components/meeting/HandRaiseQueue";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { CaptionsOverlay } from "@/components/meeting/CaptionsOverlay";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ChatSidebar } from "@/components/meeting/ChatSidebar";
import { ParticipantsSidebar } from "@/components/meeting/ParticipantsSidebar";
import { PollsPanel } from "@/components/meeting/PollsPanel";
import { QAPanel, Question } from "@/components/meeting/QAPanel";
import { WhiteboardPanel } from "@/components/meeting/WhiteboardPanel";
import { BreakoutRooms } from "@/components/meeting/BreakoutRooms";
import { SettingsModal } from "@/components/meeting/SettingsModal";
import { BackgroundPicker } from "@/components/meeting/BackgroundPicker";
import { ReactionsBurst } from "@/components/meeting/ReactionsBurst";

import { X } from "lucide-react";
import clsx from "clsx";

interface MeetingRoomProps {
  roomId: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  hostSecret: string | null;
  localMedia: ReturnType<typeof useLocalMedia>;
  initialBgMode: "none" | "blur-light" | "blur-heavy" | "image";
  initialBgImage: string;
}

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

type SidebarType = "none" | "chat" | "participants" | "polls" | "qa" | "whiteboard" | "breakout" | "settings" | "background";

export function MeetingRoom({
  roomId,
  userId,
  displayName,
  isHost: initialIsHost,
  hostSecret,
  localMedia,
  initialBgMode,
  initialBgImage,
}: MeetingRoomProps) {
  // 1. Core States
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>("none");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("auto");
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Host state can change dynamically if transferred
  const [isHost, setIsHost] = useState(initialIsHost);

  // Chat message stores
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Q&A questions store
  const [questions, setQuestions] = useState<Question[]>([]);

  // Local Reaction visual queue
  const [activeReaction, setActiveReaction] = useState<{ emoji: string; timestamp: number } | null>(null);

  // Keep track of original webcam track for background swapping & screen sharing
  const originalCameraTrackRef = useRef<MediaStreamTrack | null>(null);
  
  useEffect(() => {
    if (localMedia.videoTrack && !originalCameraTrackRef.current) {
      originalCameraTrackRef.current = localMedia.videoTrack;
    }
  }, [localMedia.videoTrack]);

  // 2. Setup Ref to resolve circular dependency between usePeerMesh and useDataChannel
  const dataHandlerRef = useRef<(senderId: string, data: string) => void>(() => {});

  // Retrieve secret token from localStorage/sessionStorage to authorize Pusher subscription
  const hostSecretOrToken = typeof window !== "undefined"
    ? (isHost ? hostSecret : sessionStorage.getItem(`peer_token_${roomId}`))
    : null;

  // 3. Instantiate WebRTC signalling presence mesh hook
  const { peers, remoteStreams, myPeerId, channel, waitingUsers, admitUser, declineUser } = usePeerMesh(
    roomId,
    localMedia.localStream,
    displayName,
    userId,
    isHost,
    hostSecretOrToken,
    useCallback((senderId: string, data: string) => {
      dataHandlerRef.current(senderId, data);
    }, [])
  );

  // 4. Instantiate WebRTC Data Channel messaging layer
  const dataChannel = useDataChannel(peers, myPeerId, channel);

  // Connect data channel incoming handler to ref
  useEffect(() => {
    dataHandlerRef.current = (senderId: string, data: string) => {
      try {
        const parsed = JSON.parse(data);
        dataChannel.handleIncomingMessage(parsed);
      } catch (err) {
        console.warn("Failed to parse incoming DataChannel message:", err);
      }
    };
  }, [dataChannel]);

  // Helper callback to securely verify if a message sender is the authenticated host in Pusher presence metadata
  const isSenderHost = useCallback((senderId: string) => {
    const member = channel?.members?.get(senderId);
    return member?.info?.isHost === true;
  }, [channel]);

  // 5. Instantiate other functional hooks
  const localAudioMeter = useAudioMeter(localMedia.localStream);
  const screenShare = useScreenShare(localMedia.localStream, localMedia.setLocalStream, originalCameraTrackRef.current);
  const background = useBackground(localMedia.localStream, localMedia.setLocalStream, originalCameraTrackRef.current);
  const breakout = useBreakoutRooms(roomId, peers, dataChannel, isSenderHost);
  const polls = usePolls(dataChannel, isSenderHost);
  const handRaise = useHandRaise(dataChannel, displayName);
  const captions = useCaptions(dataChannel, displayName);
  const recording = useRecording(localMedia.localStream, dataChannel);
  const hostControls = useHostControls(roomId, userId, isHost, hostSecret, dataChannel, channel);

  // Initialize background state from Lobby Gate selection
  useEffect(() => {
    if (initialBgMode !== "none") {
      background.setBgMode(initialBgMode);
    }
    if (initialBgImage) {
      background.setBgImage(initialBgImage);
    }
  }, []);

  // Sync isHost dynamically if hostControls updates
  useEffect(() => {
    // If room properties show user is cohost or ownership changes
    if (hostControls.coHosts.includes(userId)) {
      setIsHost(true);
    }
  }, [hostControls.coHosts, userId]);

  // 6. Broadcast local speaking state and handle active speaker indicator
  useEffect(() => {
    if (dataChannel && localMedia.localStream) {
      dataChannel.sendMessage("speaking-state", { isSpeaking: localAudioMeter.isSpeaking });
      if (localAudioMeter.isSpeaking) {
        setActiveSpeakerId(userId);
      } else if (activeSpeakerId === userId) {
        setActiveSpeakerId(null);
      }
    }
  }, [localAudioMeter.isSpeaking, dataChannel, userId]);

  // Receive speaking events from peers
  useEffect(() => {
    if (!dataChannel) return;

    const unbindSpeaking = dataChannel.onMessage("speaking-state", (payload: { isSpeaking: boolean }, senderId: string) => {
      if (payload.isSpeaking) {
        setActiveSpeakerId(senderId);
      } else if (activeSpeakerId === senderId) {
        setActiveSpeakerId(null);
      }
    });

    return () => {
      unbindSpeaking();
    };
  }, [dataChannel, activeSpeakerId]);

  // 7. Messaging & In-meeting Chat setup
  const handleSendMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      senderId: userId,
      senderName: displayName,
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    dataChannel.sendMessage("chat", msg);
  }, [dataChannel, userId, displayName]);

  useEffect(() => {
    if (!dataChannel) return;

    const unbindChat = dataChannel.onMessage("chat", (payload: ChatMessage) => {
      setMessages((prev) => [...prev, payload]);
      if (activeSidebar !== "chat") {
        setUnreadChatCount((c) => c + 1);
      }
    });

    return () => {
      unbindChat();
    };
  }, [dataChannel, activeSidebar]);

  useEffect(() => {
    if (activeSidebar === "chat") {
      setUnreadChatCount(0);
    }
  }, [activeSidebar]);

  // 8. Q&A logic integrations
  const handleSubmitQuestion = useCallback((text: string) => {
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: userId,
      senderName: displayName,
      text,
      upvotes: [],
      isAnswered: false,
      timestamp: Date.now(),
    };
    setQuestions((prev) => [...prev, newQ]);
    dataChannel.sendMessage("qa-create", { question: newQ });
  }, [dataChannel, userId, displayName]);

  const handleUpvoteQuestion = useCallback((qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const upvotes = q.upvotes.includes(userId)
            ? q.upvotes.filter((id) => id !== userId)
            : [...q.upvotes, userId];
          dataChannel.sendMessage("qa-upvote", { qId, upvotes });
          return { ...q, upvotes };
        }
        return q;
      })
    );
  }, [dataChannel, userId]);

  const handleAnswerQuestion = useCallback((qId: string, answer?: string) => {
    if (!isHost) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const updated = { ...q, isAnswered: true, answerText: answer };
          dataChannel.sendMessage("qa-answer", { qId, answerText: answer });
          return updated;
        }
        return q;
      })
    );
  }, [dataChannel, isHost]);

  const handleDeleteQuestion = useCallback((qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    dataChannel.sendMessage("qa-delete", { qId });
  }, [dataChannel]);

  useEffect(() => {
    if (!dataChannel) return;

    const unbindQCreate = dataChannel.onMessage("qa-create", (payload: { question: Question }) => {
      setQuestions((prev) => [...prev, payload.question]);
      toast("New question asked", { icon: "❓" });
    });

    const unbindQUpvote = dataChannel.onMessage("qa-upvote", (payload: { qId: string, upvotes: string[] }) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === payload.qId ? { ...q, upvotes: payload.upvotes } : q))
      );
    });

    const unbindQAnswer = dataChannel.onMessage("qa-answer", (payload: { qId: string, answerText: string }) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === payload.qId ? { ...q, isAnswered: true, answerText: payload.answerText } : q
        )
      );
      toast("A question has been answered", { icon: "✅" });
    });

    const unbindQDelete = dataChannel.onMessage("qa-delete", (payload: { qId: string }) => {
      setQuestions((prev) => prev.filter((q) => q.id !== payload.qId));
    });

    return () => {
      unbindQCreate();
      unbindQUpvote();
      unbindQAnswer();
      unbindQDelete();
    };
  }, [dataChannel]);

  // 9. Handle incoming admin host kicks & ends
  useEffect(() => {
    if (!dataChannel) return;

    const unbindKick = dataChannel.onMessage("host-kick", (payload: { targetPeerId: string }, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      if (payload.targetPeerId === userId) {
        toast.error("You have been removed from the meeting by the host");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    });

    const unbindEnd = dataChannel.onMessage("host-end", (payload: any, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      toast.error("This meeting has been closed by the host");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    });

    const unbindMute = dataChannel.onMessage("host-mute", (payload: { targetPeerId: string }, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      if (payload.targetPeerId === userId && localMedia.isMicOn) {
        localMedia.toggleMic();
        toast("You have been muted by the host", { icon: "🎙️" });
      }
    });

    const unbindMuteAll = dataChannel.onMessage("host-mute-all", (payload: any, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      if (localMedia.isMicOn && !isHost) {
        localMedia.toggleMic();
        toast("All participants have been muted by the host", { icon: "🎙️" });
      }
    });

    const unbindDisableCam = dataChannel.onMessage("host-disable-cam", (payload: { targetPeerId: string }, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      if (payload.targetPeerId === userId && localMedia.isCameraOn) {
        localMedia.toggleCamera();
        toast("Your camera was disabled by the host", { icon: "📷" });
      }
    });

    const unbindLock = dataChannel.onMessage("host-lock", (payload: { isLocked: boolean }, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      toast(payload.isLocked ? "The meeting has been locked" : "The meeting has been unlocked", { icon: "🔒" });
    });

    const unbindTransfer = dataChannel.onMessage("host-transfer", (payload: { newHostId: string }, senderId: string) => {
      if (!isSenderHost(senderId)) return;
      if (payload.newHostId === userId) {
        setIsHost(true);
        toast.success("You are now the host of this meeting!");
      } else {
        setIsHost(false);
      }
    });

    return () => {
      unbindKick();
      unbindEnd();
      unbindMute();
      unbindMuteAll();
      unbindDisableCam();
      unbindLock();
      unbindTransfer();
    };
  }, [dataChannel, userId, localMedia, isHost, isSenderHost]);

  // 10. Reactions Visual Burst
  const handleSendReaction = useCallback((emoji: string) => {
    dataChannel.sendMessage("reaction", { emoji });
    setActiveReaction({ emoji, timestamp: Date.now() });
  }, [dataChannel]);

  // 11. Keyboard Shortcuts listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing in form inputs
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || document.activeElement?.getAttribute("contenteditable")) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          e.preventDefault();
          localMedia.toggleMic();
          toast(localMedia.isMicOn ? "Microphone muted" : "Microphone active", { icon: "🎙️" });
          break;
        case "v":
          e.preventDefault();
          localMedia.toggleCamera();
          toast(localMedia.isCameraOn ? "Camera disabled" : "Camera active", { icon: "📷" });
          break;
        case "h":
          e.preventDefault();
          handRaise.toggleHand();
          break;
        case "c":
          e.preventDefault();
          captions.toggleCaptions();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [localMedia, handRaise, captions]);

  // 12. End Call handler
  const handleEndCall = () => {
    if (isHost) {
      const confirm = window.confirm("Do you want to end this meeting for everyone? (OK for all, Cancel to just leave)");
      if (confirm) {
        hostControls.endMeeting();
        return;
      }
    }
    // Just leave room
    toast.success("Leaving room...");
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  // 13. Sidebar Open state widths
  const isSidebarOpen = ["chat", "participants", "polls", "qa", "background"].includes(activeSidebar);

  return (
    <div className="fixed inset-0 w-full h-full bg-bg-app flex flex-col overflow-hidden text-text-primary">
      
      {/* Cinematic radial glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent-secondary/5 blur-[120px] pointer-events-none" />

      {/* Floating indicators overlay */}
      <div className="absolute top-4 left-4 z-tiles flex flex-col gap-2 pointer-events-none">
        {recording.isRecording && <RecordingIndicator isRecording={recording.isRecording} />}
        {isHost && waitingUsers.length > 0 && (
          <div className="glass px-3 py-2 rounded-xl border border-glass-border bg-glass-bg/85 backdrop-blur shadow-md flex items-center gap-3 pointer-events-auto select-none animate-pulse">
            <span className="text-xs font-semibold text-accent-primary">
              {waitingUsers.length} guest(s) waiting
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => admitUser(waitingUsers[0].id)}
                className="px-2 py-0.5 bg-success hover:brightness-110 text-white text-[10px] font-bold rounded-md cursor-pointer transition-all active:scale-95"
              >
                Admit
              </button>
              <button
                onClick={() => declineUser(waitingUsers[0].id)}
                className="px-2 py-0.5 bg-danger hover:brightness-110 text-white text-[10px] font-bold rounded-md cursor-pointer transition-all active:scale-95"
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </div>

      <HandRaiseQueue
        raisedHands={handRaise.raisedHands}
        isHost={isHost}
        onLowerHand={handRaise.lowerHand}
        className="z-tiles"
      />

      {/* Main video window grid */}
      <div
        className={clsx(
          "flex-1 w-full min-h-0 relative transition-all duration-300 ease-in-out pb-20",
          isSidebarOpen ? "pr-0 md:pr-[360px]" : "pr-0"
        )}
      >
        <VideoGrid
          peers={peers}
          remoteStreams={remoteStreams}
          localStream={localMedia.localStream}
          myPeerId={userId}
          displayName={displayName}
          isMicOn={localMedia.isMicOn}
          isCameraOn={localMedia.isCameraOn}
          isLocalSpeaking={localAudioMeter.isSpeaking}
          pinnedPeerId={pinnedPeerId}
          setPinnedPeerId={setPinnedPeerId}
          screenStream={screenShare.screenStream}
          layoutMode={layoutMode}
          activeSpeakerId={activeSpeakerId}
        />

        <ReactionsBurst dataChannel={dataChannel} activeReaction={activeReaction} />
        
        <CaptionsOverlay captions={captions.captions} isEnabled={captions.isEnabled} />
      </div>

      {/* Control Toolbar */}
      <ControlBar
        isMicOn={localMedia.isMicOn}
        toggleMic={localMedia.toggleMic}
        isCameraOn={localMedia.isCameraOn}
        toggleCamera={localMedia.toggleCamera}
        isSharing={screenShare.isSharing}
        toggleScreenShare={screenShare.isSharing ? screenShare.stopSharing : screenShare.startSharing}
        isHandRaised={handRaise.isRaised}
        toggleHand={handRaise.toggleHand}
        isRecording={recording.isRecording}
        toggleRecording={recording.isRecording ? recording.stopRecording : recording.startRecording}
        isCaptionsOn={captions.isEnabled}
        toggleCaptions={captions.toggleCaptions}
        activeSidebar={activeSidebar}
        setActiveSidebar={(s) => setActiveSidebar((s as SidebarType) || "none")}
        unreadChatCount={unreadChatCount}
        participantCount={peers.length + 1}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        onSendReaction={handleSendReaction}
        onEndCall={handleEndCall}
        isHost={isHost}
      />

      {/* Render Sidebars Conditionally */}
      
      {/* 1. Chat */}
      <ChatSidebar
        isOpen={activeSidebar === "chat"}
        onClose={() => setActiveSidebar("none")}
        messages={messages}
        onSendMessage={handleSendMessage}
        myPeerId={userId}
      />

      {/* 2. Participants */}
      <ParticipantsSidebar
        isOpen={activeSidebar === "participants"}
        onClose={() => setActiveSidebar("none")}
        peers={peers.map((p) => ({
          peerId: p.peerId,
          name: p.displayName,
          isMuted: p.isMuted,
          isCameraOff: p.isCameraOff,
          isHost: p.peerId === roomId, // Simple fallback host check
        }))}
        myPeerId={userId}
        myDisplayName={displayName}
        isMicOn={localMedia.isMicOn}
        isCameraOn={localMedia.isCameraOn}
        isHost={isHost}
        coHosts={hostControls.coHosts}
        onMuteParticipant={hostControls.muteParticipant}
        onDisableCamera={hostControls.disableCamera}
        onRemoveParticipant={hostControls.removeParticipant}
        onAddCoHost={hostControls.addCoHost}
        onTransferHost={hostControls.transferHost}
      />

      {/* 3. Polls */}
      {activeSidebar === "polls" && (
        <div className="fixed top-0 right-0 h-full w-full md:w-[360px] bg-bg-surface border-l border-border-subtle z-sidebar flex flex-col shadow-2xl">
          <div className="absolute top-3.5 right-4 z-overlay">
            <button
              onClick={() => setActiveSidebar("none")}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-secondary active:scale-95 transition-all cursor-pointer"
              aria-label="Close Polls Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 h-full min-h-0 overflow-hidden">
            <PollsPanel
              polls={polls.polls}
              onCreatePoll={polls.createPoll}
              onVote={polls.vote}
              onClosePoll={polls.closePoll}
              onToggleResults={polls.toggleResults}
              onExportCsv={polls.exportCsv}
              isHost={isHost}
              myPeerId={userId}
            />
          </div>
        </div>
      )}

      {/* 4. Q&A */}
      <QAPanel
        isOpen={activeSidebar === "qa"}
        onClose={() => setActiveSidebar("none")}
        questions={questions}
        onSubmitQuestion={handleSubmitQuestion}
        onUpvoteQuestion={handleUpvoteQuestion}
        onAnswerQuestion={handleAnswerQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        isHost={isHost}
        myPeerId={userId}
      />

      {/* 5. Virtual Background Picker */}
      {activeSidebar === "background" && (
        <div className="fixed top-0 right-0 h-full w-full md:w-[360px] bg-bg-surface border-l border-border-subtle z-sidebar flex flex-col shadow-2xl">
          <div className="px-4 h-14 flex items-center justify-between border-b border-border-default">
            <h2 className="text-base font-semibold text-text-primary">Effects</h2>
            <button
              onClick={() => setActiveSidebar("none")}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-secondary active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4">
            <BackgroundPicker
              bgMode={background.bgMode}
              onChangeMode={background.setBgMode}
              onChangeImage={background.setBgImage}
            />
          </div>
        </div>
      )}

      {/* Render Dialog Overlays Conditionally */}

      {/* 6. Settings Modal */}
      <SettingsModal
        isOpen={activeSidebar === "settings"}
        onClose={() => setActiveSidebar("none")}
        devices={localMedia.devices}
        selectedAudioInput={localMedia.selectedAudioInput}
        selectedVideoInput={localMedia.selectedVideoInput}
        selectedAudioOutput={localMedia.selectedAudioOutput}
        onSwitchDevice={localMedia.switchDevice}
        localStream={localMedia.localStream}
      />

      {/* 7. Whiteboard Panel */}
      <WhiteboardPanel
        isOpen={activeSidebar === "whiteboard"}
        onClose={() => setActiveSidebar("none")}
        isHost={isHost}
        dataChannel={dataChannel}
      />

      {/* 8. Breakout Rooms */}
      <BreakoutRooms
        isOpen={activeSidebar === "breakout"}
        onClose={() => setActiveSidebar("none")}
        rooms={breakout.rooms}
        peers={peers.map((p) => ({ peerId: p.peerId, name: p.displayName }))}
        onCreateRooms={breakout.createRooms}
        onAssignParticipant={breakout.assignParticipant}
        onAutoAssign={breakout.autoAssign}
        onCloseRooms={breakout.closeRooms}
        onBroadcastMessage={breakout.broadcastMessage}
        activeBreakoutId={breakout.activeBreakoutId}
        isHost={isHost}
      />

    </div>
  );
}
