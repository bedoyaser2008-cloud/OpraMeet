"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLocalMedia } from "@/hooks/useLocalMedia";
import { PinEntry } from "@/components/lobby/PinEntry";
import { LobbyPreview } from "@/components/lobby/LobbyPreview";
import { WaitingRoom } from "@/components/meeting/WaitingRoom";
import { MeetingRoom } from "./MeetingRoom";
import { getPusherClient, setAuthParams } from "@/websocket/client";
import { buildRoomChannel } from "@/websocket/config";
import { hashPasscode } from "@/lib/crypto-client";

interface RoomGateProps {
  roomId: string;
  isPrivate: boolean;
  waitingRoom: boolean;
  dbHostIdHash: string;
}

type GatePhase = "VERIFYING_PIN" | "LOBBY_PREVIEW" | "WAITING_ROOM" | "MEETING_ROOM";

export function RoomGate({ roomId, isPrivate, waitingRoom, dbHostIdHash }: RoomGateProps) {
  const router = useRouter();

  // 1. PIN verification check state
  const [pinVerified, setPinVerified] = useState(!isPrivate);

  // Once PIN is verified, mount the actual entrance logic
  if (!pinVerified) {
    return (
      <PinEntry
        roomId={roomId}
        onSuccess={() => setPinVerified(true)}
      />
    );
  }

  return (
    <RoomGateContent
      roomId={roomId}
      waitingRoom={waitingRoom}
      dbHostIdHash={dbHostIdHash}
      onReturnHome={() => router.push("/")}
    />
  );
}

function RoomGateContent({
  roomId,
  waitingRoom,
  dbHostIdHash,
  onReturnHome,
}: Omit<RoomGateProps, "isPrivate"> & { onReturnHome: () => void }) {
  const [phase, setPhase] = useState<GatePhase>("LOBBY_PREVIEW");
  const [displayName, setDisplayName] = useState("");
  const [waitingStatus, setWaitingStatus] = useState<"waiting" | "denied">("waiting");

  // Local virtual background states to pass through to MeetingRoom
  const [bgMode, setBgMode] = useState<"none" | "blur-light" | "blur-heavy" | "image">("none");
  const [bgImage, setBgImage] = useState<string>("");

  // Determine local user ID
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      const existing = sessionStorage.getItem(`user_id_${roomId}`);
      if (existing) return existing;
      const newId = `peer_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(`user_id_${roomId}`, newId);
      return newId;
    }
    return "";
  });

  const [isHost, setIsHost] = useState(false);
  const [hostSecret, setHostSecret] = useState<string | null>(null);

  // Verify host ownership securely using the hash comparison
  useEffect(() => {
    const checkHost = async () => {
      const stored = localStorage.getItem(`host_${roomId}`);
      if (stored) {
        setHostSecret(stored);
        const hash = await hashPasscode(stored);
        if (hash === dbHostIdHash) {
          setIsHost(true);
        }
      }
    };
    checkHost();
  }, [roomId, dbHostIdHash]);

  const activeUserId = userId;

  // Initialize media checks
  const localMedia = useLocalMedia();

  // Set default display name on mount from local storage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("display_name");
      if (stored) setDisplayName(stored);
    }
  }, []);

  // Handle waiting room queue socket signaling
  useEffect(() => {
    if (phase !== "WAITING_ROOM") return;

    let pusher: any;
    try {
      pusher = getPusherClient();
    } catch (err) {
      console.error("Failed to connect Pusher for waiting room:", err);
      toast.error("Signaling error. Please refresh.");
      return;
    }

    // Set auth params for the waiting room subscription
    const waitingAuthParams: Record<string, string> = {
      user_id: activeUserId,
      user_name: displayName,
      is_waiting: "true",
    };
    if (hostSecret) {
      waitingAuthParams.token = hostSecret;
    }
    setAuthParams(waitingAuthParams);

    const channelName = buildRoomChannel(roomId);
    const channel = pusher.subscribe(channelName);

    // Host admission response handler
    channel.bind("client-admit", (data: { targetPeerId: string, peerToken?: string }) => {
      if (data.targetPeerId === activeUserId) {
        if (data.peerToken) {
          sessionStorage.setItem(`peer_token_${roomId}`, data.peerToken);
        }
        toast.success("You have been admitted to the meeting");
        setPhase("MEETING_ROOM");
      }
    });

    // Host decline response handler
    channel.bind("client-decline", (data: { targetPeerId: string }) => {
      if (data.targetPeerId === activeUserId) {
        setWaitingStatus("denied");
        toast.error("Admission request declined by host");
      }
    });

    // If host kicks user while waiting
    channel.bind("client-host-kick", (data: { targetPeerId: string }) => {
      if (data.targetPeerId === activeUserId) {
        setWaitingStatus("denied");
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [phase, roomId, activeUserId, displayName]);

  const handleJoin = () => {
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    // Save display name locally for future visits
    localStorage.setItem("display_name", displayName.trim());

    if (waitingRoom && !isHost) {
      setPhase("WAITING_ROOM");
    } else {
      setPhase("MEETING_ROOM");
    }
  };

  if (phase === "LOBBY_PREVIEW") {
    return (
      <LobbyPreview
        displayName={displayName}
        setDisplayName={setDisplayName}
        isMicOn={localMedia.isMicOn}
        toggleMic={localMedia.toggleMic}
        isCameraOn={localMedia.isCameraOn}
        toggleCamera={localMedia.toggleCamera}
        localStream={localMedia.localStream}
        devices={localMedia.devices}
        selectedAudioInput={localMedia.selectedAudioInput}
        selectedVideoInput={localMedia.selectedVideoInput}
        onSwitchDevice={localMedia.switchDevice}
        bgMode={bgMode}
        onChangeBgMode={setBgMode}
        onChangeBgImage={setBgImage}
        onJoin={handleJoin}
      />
    );
  }

  if (phase === "WAITING_ROOM") {
    return (
      <WaitingRoom
        localStream={localMedia.localStream}
        isCameraOff={!localMedia.isCameraOn}
        isMuted={!localMedia.isMicOn}
        status={waitingStatus}
        onToggleCamera={localMedia.toggleCamera}
        onToggleMute={localMedia.toggleMic}
        onReturnHome={onReturnHome}
      />
    );
  }

  return (
    <MeetingRoom
      roomId={roomId}
      userId={activeUserId}
      displayName={displayName}
      isHost={isHost}
      hostSecret={hostSecret}
      localMedia={localMedia}
      initialBgMode={bgMode}
      initialBgImage={bgImage}
    />
  );
}
