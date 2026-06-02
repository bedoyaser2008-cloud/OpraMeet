"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicOff, Pin, PinOff, Maximize2 } from "lucide-react";
import clsx from "clsx";

interface VideoTileProps {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
}

/**
 * Premium video rendering tile using the Dark Cinema aesthetic.
 * Handles mirror configurations, offscreen loading, speaking indicators, and overlays.
 */
export function VideoTile({
  peerId,
  displayName,
  stream,
  isLocal,
  isMuted,
  isCameraOff,
  isSpeaking,
  isPinned,
  onPinToggle,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;

    videoRef.current.srcObject = stream;
    
    videoRef.current.onloadedmetadata = () => {
      videoRef.current?.play().catch((e) => {
        console.warn("Video autoplay blocked by browser policies:", e);
      });
    };
  }, [stream, isCameraOff]);

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={clsx(
        "relative w-full h-full bg-bg-tile rounded-lg overflow-hidden group select-none transition-all duration-300 border border-border-subtle",
        {
          "border-success shadow-glow-success animate-pulse-speaker": isSpeaking && !isMuted,
          "border-border-focus shadow-lg": isPinned,
        }
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Offscreen Camera Off avatar representation */}
      <AnimatePresence>
        {isCameraOff || !stream || stream.getVideoTracks().length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950"
          >
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 border border-border-default shadow-lg">
              {isSpeaking && !isMuted && (
                <span className="absolute inset-0 rounded-full border border-success opacity-75 animate-ping" />
              )}
              <span className="text-xl font-semibold text-text-primary">{initials}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Render `<video>` if active */}
      {!isCameraOff && stream && stream.getVideoTracks().length > 0 && (
        <video
          ref={videoRef}
          muted={isLocal} // Avoid feedback loop
          playsInline
          autoPlay
          className={clsx("w-full h-full object-cover transition-transform duration-300", {
            "scale-x-[-1]": isLocal,
          })}
        />
      )}

      {/* Bottom controls panel */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-tiles">
        <div className="flex items-center px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/5 shadow-sm text-xs font-medium text-text-primary">
          <span className="truncate max-w-[120px]">{displayName} {isLocal && "(You)"}</span>
        </div>

        {isMuted && (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/90 border border-rose-400/20 shadow-md">
            <MicOff className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Top right pinned icon badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none z-tiles">
        {isPinned && (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/5 shadow-sm">
            <Pin className="w-3.5 h-3.5 text-accent-primary" />
          </div>
        )}
      </div>

      {/* Action overlay triggered on mouse hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 backdrop-blur-[2px] z-tiles pointer-events-auto"
          >
            <button
              onClick={onPinToggle}
              aria-label={isPinned ? "Unpin participant" : "Pin participant"}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-white/10 text-text-primary hover:scale-105 active:scale-95 transition-all duration-150 shadow-md cursor-pointer"
            >
              {isPinned ? <PinOff className="w-4 h-4 text-accent-primary" /> : <Pin className="w-4 h-4" />}
            </button>
            
            {!isLocal && (
              <button
                aria-label="Maximize video tile"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-white/10 text-text-primary hover:scale-105 active:scale-95 transition-all duration-150 shadow-md cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
