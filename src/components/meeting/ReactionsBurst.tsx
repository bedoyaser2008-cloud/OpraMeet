"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REACTION_EMOJIS } from "@/lib/constants";
import clsx from "clsx";

interface ReactionInstance {
  id: string;
  emoji: string;
  xOffset: number;
}

interface ReactionsBurstProps {
  dataChannel?: any;
  /** Optionally trigger bursts programmatically from outside */
  activeReaction?: { emoji: string; timestamp: number } | null;
}

/**
 * Premium ReactionsBurst component.
 * Displays flying emojis floating upward, scaling up and fading out over 3 seconds.
 * Listens to "reaction" events from WebRTC dataChannel or external state changes.
 */
export function ReactionsBurst({ dataChannel, activeReaction }: ReactionsBurstProps) {
  const [reactions, setReactions] = useState<ReactionInstance[]>([]);

  const triggerReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    // Random offset between -80 and +80 px
    const xOffset = (Math.random() - 0.5) * 160;
    
    setReactions((prev) => [...prev, { id, emoji, xOffset }]);

    // Clean up after animation finishes (3 seconds)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }, []);

  // Listen to WebRTC DataChannel reaction messages
  useEffect(() => {
    if (!dataChannel) return;

    const unbindReaction = dataChannel.onMessage(
      "reaction",
      (payload: any) => {
        if (payload?.emoji) {
          triggerReaction(payload.emoji);
        }
      }
    );

    return () => {
      unbindReaction();
    };
  }, [dataChannel, triggerReaction]);

  // Listen to manual triggers from prop
  useEffect(() => {
    if (activeReaction?.emoji) {
      triggerReaction(activeReaction.emoji);
    }
  }, [activeReaction, triggerReaction]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-overlay flex items-end justify-center pb-24">
      <AnimatePresence>
        {reactions.map(({ id, emoji, xOffset }) => (
          <motion.span
            key={id}
            initial={{ opacity: 0, scale: 0, x: xOffset, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.7],
              y: -350,
              x: [
                xOffset,
                xOffset + (xOffset > 0 ? 25 : -25),
                xOffset + (xOffset > 0 ? 50 : -50),
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              ease: [0.25, 0.1, 0.25, 1], // ease-smooth
            }}
            className="absolute text-5xl select-none filter drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
          >
            {emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ReactionsPickerProps {
  onSelectEmoji?: (emoji: string) => void;
  dataChannel?: any;
  className?: string;
}

/**
 * Premium ReactionsPicker component displaying 6 popular emojis.
 * Includes pressed scaling feedback and hover states.
 * Automatically broadcasts reaction over WebRTC dataChannel if provided.
 */
export function ReactionsPicker({
  onSelectEmoji,
  dataChannel,
  className,
}: ReactionsPickerProps) {
  const handleEmojiClick = (emoji: string) => {
    if (onSelectEmoji) {
      onSelectEmoji(emoji);
    }
    if (dataChannel) {
      dataChannel.sendMessage("reaction", { emoji });
    }
  };

  return (
    <div
      className={clsx(
        "glass border border-glass-border rounded-2xl p-2.5 flex items-center gap-2 shadow-2xl bg-glass-bg backdrop-blur-xl",
        className
      )}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-border-focus"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
