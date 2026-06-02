"use client";

import { useEffect, useRef, useCallback } from "react";

export interface DataMessage<T = any> {
  type: string;
  payload: T;
  senderId: string;
  timestamp: number;
}

/**
 * Hook to manage high-speed in-meeting WebRTC DataChannels with automatic Pusher fallback.
 */
export function useDataChannel(
  peers: any[],
  myPeerId: string,
  pusherChannel: any
) {
  const listenersRef = useRef<Map<string, Set<(payload: any, senderId: string) => void>>>(new Map());

  // Registers a callback for a specific message type
  const onMessage = useCallback((
    type: string,
    callback: (payload: any, senderId: string) => void
  ) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(callback);
    
    return () => {
      listenersRef.current.get(type)?.delete(callback);
    };
  }, []);

  // Broadcasts a message to all peers via WebRTC DataChannel (fallback to Pusher)
  const sendMessage = useCallback((type: string, payload: any) => {
    const message: DataMessage = {
      type,
      payload,
      senderId: myPeerId,
      timestamp: Date.now(),
    };
    
    const messageStr = JSON.stringify(message);
    let sentToAllPeers = true;

    // Try sending over WebRTC DataChannel for each peer
    peers.forEach((peerConn) => {
      const { peer, peerId } = peerConn;
      if (peer && peer.connected) {
        try {
          peer.send(messageStr);
        } catch (err) {
          console.warn(`Failed to send WebRTC data to peer ${peerId}:`, err);
          sentToAllPeers = false;
        }
      } else {
        sentToAllPeers = false;
      }
    });

    // Fallback: if not all peers are fully connected, sync via Pusher channel client event
    if (!sentToAllPeers && pusherChannel) {
      try {
        const clientEventName = `client-${type}`;
        pusherChannel.trigger(clientEventName, message);
      } catch (err) {
        console.error(`Pusher signaling fallback failed for event client-${type}:`, err);
      }
    }
  }, [peers, myPeerId, pusherChannel]);

  // Routes incoming data events to registered event handlers
  const handleIncomingMessage = useCallback((msg: DataMessage) => {
    const { type, payload, senderId } = msg;
    if (senderId === myPeerId) return; // Prevent infinite loops / own echo
    
    const handlers = listenersRef.current.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload, senderId));
    }
  }, [myPeerId]);

  // Bind Pusher event fallbacks
  useEffect(() => {
    if (!pusherChannel) return;

    const eventNames = [
      "chat",
      "reaction",
      "hand-raise",
      "hand-lower",
      "poll-create",
      "poll-vote",
      "poll-close",
      "whiteboard-draw",
      "caption",
      "state-sync",
      "host-kick",
      "host-mute",
      "host-disable-cam",
      "host-lock",
      "host-unlock",
      "host-end",
      "host-transfer",
      "cohost-add",
      "permission-update",
    ];

    eventNames.forEach((eventName) => {
      pusherChannel.bind(`client-${eventName}`, (data: DataMessage) => {
        handleIncomingMessage(data);
      });
    });

    return () => {
      eventNames.forEach((eventName) => {
        pusherChannel.unbind(`client-${eventName}`);
      });
    };
  }, [pusherChannel, handleIncomingMessage]);

  return {
    sendMessage,
    onMessage,
    handleIncomingMessage,
  };
}
