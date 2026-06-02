"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ClientMediaProcessor } from "@/lib/videoBackground";

export type BackgroundMode = "none" | "blur-light" | "blur-heavy" | "image";

/**
 * Hook to manage AI-based video background blur or replacement.
 * Feeds camera tracks into canvas segmentation and captures resulting stream.
 */
export function useBackground(
  localStream: MediaStream | null,
  setLocalStream: (stream: MediaStream | null) => void,
  cameraTrack: MediaStreamTrack | null
) {
  const [bgMode, setBgModeState] = useState<BackgroundMode>("none");
  const [bgImage, setBgImageState] = useState<string>("");
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const processorRef = useRef<ClientMediaProcessor | null>(null);
  const activeTrackRef = useRef<MediaStreamTrack | null>(null);

  // Initialize background processor
  useEffect(() => {
    processorRef.current = new ClientMediaProcessor();
    return () => {
      if (processorRef.current) {
        processorRef.current.stop();
      }
    };
  }, []);

  const setBgMode = useCallback((mode: BackgroundMode) => {
    setBgModeState(mode);
    if (processorRef.current) {
      processorRef.current.setBgMode(mode);
    }
  }, []);

  const setBgImage = useCallback((url: string) => {
    setBgImageState(url);
    if (processorRef.current) {
      processorRef.current.setBgImage(url);
    }
  }, []);

  // Update canvas segmentation logic when configurations change
  useEffect(() => {
    if (!localStream || !cameraTrack || !processorRef.current) {
      return;
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    if (!canvasRef.current) {
      canvasRef.current = canvas;
    }

    if (bgMode === "none") {
      processorRef.current.stop();
      
      // Restore camera track
      const currentTrack = localStream.getVideoTracks()[0];
      if (currentTrack && currentTrack !== cameraTrack) {
        localStream.removeTrack(currentTrack);
        localStream.addTrack(cameraTrack);
        setLocalStream(new MediaStream(localStream.getTracks()));
      }
      setProcessedStream(null);
      activeTrackRef.current = cameraTrack;
    } else {
      processorRef.current.stop();
      // Pipe camera input through compositor
      processorRef.current.start(cameraTrack, canvas);

      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (canvasStream) {
        setProcessedStream(canvasStream);
        const canvasTrack = canvasStream.getVideoTracks()[0];
        
        if (canvasTrack) {
          activeTrackRef.current = canvasTrack;
          
          // Replace track in localStream to trigger WebRTC renegotiation
          const currentTrack = localStream.getVideoTracks()[0];
          if (currentTrack) {
            localStream.removeTrack(currentTrack);
          }
          localStream.addTrack(canvasTrack);
          setLocalStream(new MediaStream(localStream.getTracks()));
        }
      }
    }
  }, [bgMode, bgImage, localStream, cameraTrack, setLocalStream]);

  return {
    bgMode,
    setBgMode,
    setBgImage,
    canvasRef,
    processedStream,
    activeVideoTrack: activeTrackRef.current,
  };
}
