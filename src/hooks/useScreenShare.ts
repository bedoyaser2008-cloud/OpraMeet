"use client";

import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Hook to manage screen sharing by swapping local video tracks with display media stream tracks.
 */
export function useScreenShare(
  localStream: MediaStream | null,
  setLocalStream: (stream: MediaStream | null) => void,
  cameraTrack: MediaStreamTrack | null
) {
  const [isSharing, setIsSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const stopSharing = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    
    setIsSharing(false);

    if (localStream && cameraTrack) {
      const currentVideoTrack = localStream.getVideoTracks()[0];
      if (currentVideoTrack) {
        localStream.removeTrack(currentVideoTrack);
      }
      localStream.addTrack(cameraTrack);
      
      // Update stream reference to trigger React updates in hooks consuming localStream
      setLocalStream(new MediaStream(localStream.getTracks()));
    }
    toast.success("Screen sharing stopped");
  }, [localStream, cameraTrack, setLocalStream]);

  const startSharing = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      screenStreamRef.current = screenStream;
      setIsSharing(true);
      toast.success("Presenting screen");

      const screenTrack = screenStream.getVideoTracks()[0];

      if (localStream) {
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) {
          localStream.removeTrack(currentVideoTrack);
        }
        localStream.addTrack(screenTrack);
        
        // Update stream reference to trigger WebRTC renegotiation/track swap
        setLocalStream(new MediaStream(localStream.getTracks()));
      }

      // Handle user clicking "Stop Sharing" on Chrome native bar
      screenTrack.onended = () => {
        stopSharing();
      };

    } catch (err: any) {
      console.error("Screen share access denied:", err);
      toast.error(`Screen share failed: ${err.message || "User denied permissions."}`);
    }
  }, [localStream, stopSharing, setLocalStream]);

  return {
    isSharing,
    startSharing,
    stopSharing,
    screenStream: screenStreamRef.current,
  };
}
