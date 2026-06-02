"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface RecordingIndicatorProps {
  isRecording: boolean;
  className?: string;
}

/**
 * Premium RecordingIndicator component.
 * Displays a top-left floating recording badge with a pulsing red status indicator,
 * JetBrains Mono "REC" typography, and a live duration timer.
 */
export function RecordingIndicator({ isRecording, className }: RecordingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  // Tick the timer when recording is active
  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Format seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }} // ease-spring
          className={clsx(
            "absolute top-4 left-4 z-sidebar pointer-events-none select-none",
            className
          )}
        >
          <div className="glass border border-glass-border px-3.5 py-1.5 rounded-full bg-glass-bg/90 backdrop-blur-xl shadow-lg flex items-center gap-2.5">
            {/* Pulsing red dot core */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
            </span>

            {/* JetBrains Mono REC text */}
            <span className="font-mono text-[10px] font-extrabold tracking-widest text-danger">
              REC
            </span>

            {/* Separator line */}
            <span className="h-3 w-[1px] bg-white/10" />

            {/* JetBrains Mono duration timer */}
            <span className="font-mono text-xs font-medium text-text-primary">
              {formatTime(elapsed)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
