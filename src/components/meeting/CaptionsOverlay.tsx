"use client";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export interface CaptionEntry {
  peerId: string;
  name: string;
  text: string;
  timestamp: number;
}

interface CaptionsOverlayProps {
  captions: CaptionEntry[];
  isEnabled: boolean;
  className?: string;
}

/**
 * Premium CaptionsOverlay component.
 * Displays the last 3 lines of live transcribed speech in a centered frosted-glass capsule.
 * Uses smooth slide-up and fade-in animations for entries.
 */
export function CaptionsOverlay({
  captions,
  isEnabled,
  className,
}: CaptionsOverlayProps) {
  if (!isEnabled) return null;

  // Render only the last 3 captions
  const activeCaptions = captions.slice(-3);

  return (
    <div
      className={clsx(
        "absolute bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-overlay pointer-events-none select-none",
        className
      )}
    >
      <AnimatePresence>
        {activeCaptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass border border-glass-border rounded-2xl px-5 py-3.5 bg-glass-bg/85 backdrop-blur-xl shadow-2xl flex flex-col gap-2.5 pointer-events-auto"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {activeCaptions.map((caption) => (
                <motion.div
                  key={`${caption.peerId}-${caption.timestamp}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-start gap-3 w-full"
                >
                  {/* Speaker Label */}
                  <span className="shrink-0 font-mono text-[10px] font-bold text-accent-primary uppercase tracking-wider bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded-md mt-0.5">
                    {caption.name}
                  </span>

                  {/* Caption Text */}
                  <span className="font-sans text-xs md:text-sm text-text-primary leading-relaxed break-words text-left">
                    {caption.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
