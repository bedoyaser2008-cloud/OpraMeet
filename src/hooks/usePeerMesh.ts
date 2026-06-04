"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getPusherClient, setAuthParams } from "@/websocket/client";
import { buildRoomChannel } from "@/websocket/config";
import { SIGNAL_EVENTS } from "@/websocket/events";
import { ICE_SERVERS } from "@/lib/constants";
import toast from "react-hot-toast";

let SimplePeer: any;
if (typeof window !== "undefined") {
  SimplePeer = require("simple-peer");
}

export interface PeerConnection {
  peerId: string;
  displayName: string;
  peer: any; // simple-peer Instance
  isMuted: boolean;
  isCameraOff: boolean;
}

/**
 * Hook to coordinate multi-party WebRTC mesh network signaling via Pusher Channels.
 */
export function usePeerMesh(
  roomId: string,
  localStream: MediaStream | null,
  displayName: string,
  userId: string,
  isHost: boolean,
  hostSecretOrToken: string | null,
  onDataReceived?: (senderId: string, data: string) => void
) {
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [waitingUsers, setWaitingUsers] = useState<{ id: string; name: string }[]>([]);

  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const onDataReceivedRef = useRef(onDataReceived);

  // Sync refs
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  const setRemoteStream = useCallback((peerId: string, stream: MediaStream | null) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      if (stream) {
        next.set(peerId, stream);
      } else {
        next.delete(peerId);
      }
      return next;
    });
  }, []);

  const destroyPeerConnection = useCallback((peerId: string) => {
    const peerConn = peersRef.current.get(peerId);
    if (peerConn) {
      try {
        peerConn.peer.destroy();
      } catch (err) {
        console.warn(`Error destroying peer ${peerId}:`, err);
      }
      peersRef.current.delete(peerId);
      setPeers(Array.from(peersRef.current.values()));
      setRemoteStream(peerId, null);
    }
  }, [setRemoteStream]);

  const createPeer = useCallback((
    targetPeerId: string,
    targetDisplayName: string,
    initiator: boolean
  ): PeerConnection | undefined => {
    if (!localStreamRef.current) {
      console.warn("Cannot create peer connection: localStream is not ready yet.");
      return undefined;
    }

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStreamRef.current,
      config: { iceServers: ICE_SERVERS },
    });

    const peerConn: PeerConnection = {
      peerId: targetPeerId,
      displayName: targetDisplayName,
      peer,
      isMuted: false,
      isCameraOff: false,
    };

    peersRef.current.set(targetPeerId, peerConn);
    setPeers(Array.from(peersRef.current.values()));

    // Signaling triggers
    peer.on("signal", (signalData: any) => {
      if (channelRef.current) {
        const payload = {
          targetId: targetPeerId,
          senderId: userId,
          senderName: displayName,
          signal: signalData,
        };
        
        if (signalData.type === "offer") {
          channelRef.current.trigger(SIGNAL_EVENTS.PEER_OFFER, payload);
        } else if (signalData.type === "answer") {
          channelRef.current.trigger(SIGNAL_EVENTS.PEER_ANSWER, payload);
        } else if (signalData.candidate) {
          channelRef.current.trigger(SIGNAL_EVENTS.ICE_CANDIDATE, payload);
        }
      }
    });

    // Remote stream event
    peer.on("stream", (remoteStream: MediaStream) => {
      setRemoteStream(targetPeerId, remoteStream);
    });

    // Handle peer data channel message
    peer.on("data", (data: any) => {
      if (onDataReceivedRef.current) {
        onDataReceivedRef.current(targetPeerId, data.toString());
      }
    });

    // Handle peer closed
    peer.on("close", () => {
      destroyPeerConnection(targetPeerId);
    });

    peer.on("error", (err: any) => {
      console.error(`SimplePeer error with ${targetPeerId}:`, err);
      destroyPeerConnection(targetPeerId);
    });

    return peerConn;
  }, [userId, displayName, destroyPeerConnection, setRemoteStream]);

  // Subscribe to channel and register signaling handlers
  useEffect(() => {
    if (!localStream) return;
    if (typeof window === "undefined") return;

    setMyPeerId(userId);

    let pusher: any;
    try {
      pusher = getPusherClient();
    } catch (err: any) {
      console.error("Failed to get Pusher client:", err);
      return;
    }

    // Set auth params that will be sent with the channel subscription auth request
    const authParams: Record<string, string> = {
      user_id: userId,
      user_name: displayName,
    };
    if (hostSecretOrToken) {
      authParams.token = hostSecretOrToken;
    }
    setAuthParams(authParams);

    const channelName = buildRoomChannel(roomId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      members.each((member: any) => {
        if (member.id !== userId) {
          if (member.info?.isWaiting) {
            if (isHost) {
              setWaitingUsers((prev) => {
                if (prev.some((u) => u.id === member.id)) return prev;
                return [...prev, { id: member.id, name: member.info.name }];
              });
            }
          } else {
            createPeer(member.id, member.info.name, true);
          }
        }
      });
    });

    channel.bind("pusher:member_added", (member: any) => {
      if (member.id !== userId) {
        if (member.info?.isWaiting) {
          if (isHost) {
            setWaitingUsers((prev) => {
              if (prev.some((u) => u.id === member.id)) return prev;
              return [...prev, { id: member.id, name: member.info.name }];
            });
            toast(`${member.info.name} is waiting to join`);
          }
        } else {
          toast(`${member.info.name} joined the meeting`);
          createPeer(member.id, member.info.name, false);
        }
      }
    });

    channel.bind("pusher:member_removed", (member: any) => {
      if (member.id !== userId) {
        setWaitingUsers((prev) => prev.filter((u) => u.id !== member.id));
        if (peersRef.current.has(member.id)) {
          toast(`${member.info.name} left the meeting`);
          destroyPeerConnection(member.id);
        }
      }
    });

    channel.bind(SIGNAL_EVENTS.PEER_OFFER, (data: any) => {
      if (data.targetId === userId) {
        let peerConn = peersRef.current.get(data.senderId);
        if (!peerConn) {
          peerConn = createPeer(data.senderId, data.senderName, false);
        }
        peerConn?.peer.signal(data.signal);
      }
    });

    channel.bind(SIGNAL_EVENTS.PEER_ANSWER, (data: any) => {
      if (data.targetId === userId) {
        const peerConn = peersRef.current.get(data.senderId);
        peerConn?.peer.signal(data.signal);
      }
    });

    channel.bind(SIGNAL_EVENTS.ICE_CANDIDATE, (data: any) => {
      if (data.targetId === userId) {
        const peerConn = peersRef.current.get(data.senderId);
        peerConn?.peer.signal(data.signal);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      Array.from(peersRef.current.keys()).forEach((peerId) => {
        destroyPeerConnection(peerId);
      });
    };
  }, [roomId, localStream, userId, displayName, isHost, hostSecretOrToken, createPeer, destroyPeerConnection]);

  // Sync tracks when localStream changes (e.g. mic mute/unmute, screen share toggled)
  useEffect(() => {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    const videoTrack = localStream.getVideoTracks()[0];

    peersRef.current.forEach((peerConn) => {
      const senders = peerConn.peer.senders || [];
      
      if (audioTrack) {
        const audioSender = senders.find((s: any) => s.track && s.track.kind === "audio");
        if (audioSender) {
          try {
            audioSender.replaceTrack(audioTrack);
          } catch (err) {
            console.warn("Failed to replace audio track:", err);
          }
        }
      }

      if (videoTrack) {
        const videoSender = senders.find((s: any) => s.track && s.track.kind === "video");
        if (videoSender) {
          try {
            videoSender.replaceTrack(videoTrack);
          } catch (err) {
            console.warn("Failed to replace video track:", err);
          }
        }
      }
    });
  }, [localStream]);

  const admitUser = useCallback(async (targetUserId: string) => {
    if (!isHost) return;
    try {
      const res = await fetch("/api/pusher/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          hostId: hostSecretOrToken,
          channel: channelRef.current?.name,
          event: "client-admit",
          data: { targetPeerId: targetUserId },
        }),
      });
      if (res.ok) {
        toast.success("Guest admitted");
        setWaitingUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      } else {
        const err = await res.json();
        toast.error(`Admission failed: ${err.error || "Server issue."}`);
      }
    } catch (e) {
      toast.error("Network error admitting guest");
    }
  }, [roomId, userId, isHost]);

  const declineUser = useCallback(async (targetUserId: string) => {
    if (!isHost) return;
    try {
      const res = await fetch("/api/pusher/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          hostId: hostSecretOrToken,
          channel: channelRef.current?.name,
          event: "client-decline",
          data: { targetPeerId: targetUserId },
        }),
      });
      if (res.ok) {
        toast.success("Guest declined");
        setWaitingUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      } else {
        const err = await res.json();
        toast.error(`Decline failed: ${err.error || "Server issue."}`);
      }
    } catch (e) {
      toast.error("Network error declining guest");
    }
  }, [roomId, userId, isHost]);

  return {
    peers,
    remoteStreams,
    myPeerId,
    channel: channelRef.current,
    waitingUsers,
    admitUser,
    declineUser,
  };
}
