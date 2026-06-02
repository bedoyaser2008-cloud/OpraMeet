"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export interface RaisedHand {
  peerId: string;
  name: string;
  timestamp: number;
}

/**
 * Hook to manage hand raising queues and alerts.
 * Uses Web Audio synthesizer to generate notify tones without external sound files.
 */
export function useHandRaise(dataChannel: any, displayName: string) {
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [isRaised, setIsRaised] = useState(false);

  // Play clean synthesized chime sound
  const playHandRaiseSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      // Double note chime (D5 -> A5)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Chime playback skipped:", e);
    }
  }, []);

  const toggleHand = useCallback(() => {
    const myId = dataChannel?.myPeerId || "local";
    const now = Date.now();
    
    setIsRaised((prev) => {
      const next = !prev;
      if (next) {
        dataChannel?.sendMessage("hand-raise", { name: displayName, timestamp: now });
        setRaisedHands((current) => {
          if (current.some(h => h.peerId === myId)) return current;
          return [...current, { peerId: myId, name: displayName, timestamp: now }]
            .sort((a, b) => a.timestamp - b.timestamp);
        });
        playHandRaiseSound();
      } else {
        dataChannel?.sendMessage("hand-lower", {});
        setRaisedHands((current) => current.filter(h => h.peerId !== myId));
      }
      return next;
    });
  }, [dataChannel, displayName, playHandRaiseSound]);

  const lowerHand = useCallback((peerId: string) => {
    const myId = dataChannel?.myPeerId || "local";
    
    if (peerId === myId) {
      setIsRaised(false);
      dataChannel?.sendMessage("hand-lower", {});
    } else {
      // Host action to lower peer hand
      dataChannel?.sendMessage("host-lower-hand", { targetPeerId: peerId });
    }
    
    setRaisedHands((current) => current.filter(h => h.peerId !== peerId));
  }, [dataChannel]);

  // Setup messaging listeners
  useEffect(() => {
    if (!dataChannel) return;

    const unbindRaise = dataChannel.onMessage("hand-raise", (payload: any, senderId: string) => {
      const { name, timestamp } = payload;
      
      setRaisedHands((current) => {
        if (current.some(h => h.peerId === senderId)) return current;
        return [...current, { peerId: senderId, name, timestamp }]
          .sort((a, b) => a.timestamp - b.timestamp);
      });
      
      playHandRaiseSound();
      toast(`${name} raised hand`, { icon: "✋" });
    });

    const unbindLower = dataChannel.onMessage("hand-lower", (payload: any, senderId: string) => {
      setRaisedHands((current) => current.filter(h => h.peerId !== senderId));
    });

    const unbindHostLower = dataChannel.onMessage("host-lower-hand", (payload: any) => {
      const { targetPeerId } = payload;
      const myId = dataChannel.myPeerId;
      
      if (targetPeerId === myId) {
        setIsRaised(false);
        toast("Your hand was lowered by the host", { icon: "✋" });
      }
      setRaisedHands((current) => current.filter(h => h.peerId !== targetPeerId));
    });

    return () => {
      unbindRaise();
      unbindLower();
      unbindHostLower();
    };
  }, [dataChannel, playHandRaiseSound]);

  return {
    raisedHands,
    isRaised,
    toggleHand,
    lowerHand,
  };
}
