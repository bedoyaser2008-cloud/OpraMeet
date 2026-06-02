"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, ShieldAlert, LogOut, Loader2 } from "lucide-react";
import clsx from "clsx";

interface WaitingRoomProps {
  localStream: MediaStream | null;
  isCameraOff: boolean;
  isMuted: boolean;
  status: "waiting" | "denied";
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onReturnHome: () => void;
  className?: string;
}

/**
 * Premium WaitingRoom component.
 * Displays a full-screen lobby showing camera check-in, toggles for mic/camera,
 * and handles both waiting status (with dot micro-animations) and access denied states.
 */
export function WaitingRoom({
  localStream,
  isCameraOff,
  isMuted,
  status,
  onToggleCamera,
  onToggleMute,
  onReturnHome,
  className,
}: WaitingRoomProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Bind local stream to video element
  useEffect(() => {
    if (!videoRef.current || !localStream || isCameraOff) return;

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    videoRef.current.srcObject = localStream;
    videoRef.current.onloadedmetadata = () => {
      videoRef.current?.play().catch((err) => {
        console.warn("Autoplay blocked inside waiting room:", err);
      });
    };
  }, [localStream, isCameraOff]);

  return (
    <div
      className={clsx(
        "fixed inset-0 w-full h-full bg-bg-app flex items-center justify-center z-modal overflow-hidden select-none",
        className
      )}
    >
      {/* Background cinematic radial glows */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-accent-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-accent-secondary/5 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <AnimatePresence mode="wait">
        {status === "waiting" ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full max-w-md glass border border-glass-border rounded-2xl p-6 bg-glass-bg/70 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center z-base"
          >
            {/* Camera Preview Grid */}
            <div className="relative w-full aspect-video bg-gray-900 border border-white/5 rounded-xl overflow-hidden mb-6 flex items-center justify-center shadow-inner group">
              <AnimatePresence mode="wait">
                {isCameraOff || !localStream ? (
                  <motion.div
                    key="camera-off"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 gap-2"
                  >
                    <div className="relative w-16 h-16 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shadow-lg">
                      <span className="absolute inset-0 rounded-full border border-accent-secondary/35 animate-ping" />
                      <VideoOff className="w-6 h-6 text-text-secondary" />
                    </div>
                    <span className="font-sans text-xs text-text-secondary mt-1">
                      Camera is turned off
                    </span>
                  </motion.div>
                ) : (
                  <motion.video
                    key="camera-on"
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover scale-x-[-1]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              {/* Float Controls Overlay */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/5 z-tiles">
                {/* Audio Check Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleMute}
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center border border-white/10 transition-all duration-200 cursor-pointer hover:brightness-110",
                    !isMuted ? "bg-bg-elevated text-text-primary" : "bg-danger text-white border-transparent"
                  )}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </motion.button>

                {/* Video Check Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleCamera}
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center border border-white/10 transition-all duration-200 cursor-pointer hover:brightness-110",
                    !isCameraOff ? "bg-bg-elevated text-text-primary" : "bg-danger text-white border-transparent"
                  )}
                  title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {!isCameraOff ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            {/* Waiting status information */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-accent-primary/10 border border-accent-primary/20 rounded-full px-3 py-1 text-accent-primary font-medium text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Requesting entry</span>
              </div>
              <h2 className="font-sans font-bold text-lg text-text-primary mt-1">
                OpraMeet Pre-lobby
              </h2>
              
              <div className="flex items-center gap-1.5 text-text-secondary text-sm font-sans mt-0.5">
                <span>Waiting for the host to let you in</span>
                <span className="flex gap-0.5 mt-1 shrink-0">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                    className="w-1.5 h-1.5 bg-accent-primary rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.25 }}
                    className="w-1.5 h-1.5 bg-accent-primary rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.5 }}
                    className="w-1.5 h-1.5 bg-accent-primary rounded-full"
                  />
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="denied"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full max-w-sm glass border border-glass-border rounded-2xl p-8 bg-glass-bg/75 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center z-base"
          >
            {/* Denied / Alert Icon */}
            <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-5 text-danger shadow-[0_0_24px_rgba(244,63,94,0.15)] animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Error Message */}
            <h2 className="font-sans font-bold text-xl text-text-primary mb-2">
              Access Denied
            </h2>
            <p className="font-sans text-xs text-text-secondary leading-relaxed mb-8 px-4">
              The host has declined your request to join this meeting room, or you have been ejected. Please contact the organizer for details.
            </p>

            {/* Return Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={onReturnHome}
              className="w-full py-3 bg-danger hover:bg-danger-hover text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-danger-hover transition-colors shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-border-focus"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Home</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Default export fallback
export default WaitingRoom;
