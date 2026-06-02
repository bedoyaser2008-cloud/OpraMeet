"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, ArrowDown } from "lucide-react";
import clsx from "clsx";

export interface RaisedHand {
  peerId: string;
  name: string;
  timestamp: number;
}

interface HandRaiseQueueProps {
  raisedHands: RaisedHand[];
  isHost: boolean;
  onLowerHand: (peerId: string) => void;
  className?: string;
}

/**
 * Premium HandRaiseQueue panel.
 * Slides in from the right, floating in the top-right corner of the meeting screen.
 * Displays participants who raised their hands in chronological order with live-updating elapsed time.
 */
export function HandRaiseQueue({
  raisedHands,
  isHost,
  onLowerHand,
  className,
}: HandRaiseQueueProps) {
  const [now, setNow] = useState(Date.now());

  // Update timestamps every 10 seconds to keep elapsed time relative text fresh
  useEffect(() => {
    if (raisedHands.length === 0) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [raisedHands.length]);

  const getRelativeTime = (timestamp: number) => {
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 10) return "just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ago`;
  };

  return (
    <div className={clsx("absolute top-4 right-4 z-sidebar pointer-events-none", className)}>
      <AnimatePresence>
        {raisedHands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.8,
            }}
            className="w-76 glass border border-glass-border rounded-2xl shadow-2xl p-4 bg-glass-bg backdrop-blur-xl pointer-events-auto flex flex-col gap-3 select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-warning/20 text-warning animate-bounce">
                  <Hand className="w-3.5 h-3.5" />
                </div>
                <span className="font-sans font-semibold text-sm text-text-primary">
                  Raised Hands
                </span>
              </div>
              <span className="font-mono text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded-full">
                {raisedHands.length}
              </span>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {raisedHands.map((item, index) => (
                  <motion.div
                    key={item.peerId}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-sans font-medium text-xs text-text-primary truncate">
                        {index + 1}. {item.name}
                      </span>
                      <span className="font-mono text-[10px] text-text-tertiary">
                        {getRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    {isHost && (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => onLowerHand(item.peerId)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 hover:border-transparent rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-border-focus"
                      >
                        Lower
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
