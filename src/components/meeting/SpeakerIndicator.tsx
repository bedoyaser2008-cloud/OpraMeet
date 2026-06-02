"use client";

import React from "react";
import clsx from "clsx";

interface SpeakerIndicatorProps {
  isSpeaking: boolean;
  isMuted: boolean;
  children: React.ReactNode;
}

/**
 * SpeakerIndicator component wraps video tiles and adds a speaking state visual border.
 * Respects CSS custom property transitions and animations.
 */
export function SpeakerIndicator({ isSpeaking, isMuted, children }: SpeakerIndicatorProps) {
  return (
    <div
      className={clsx("w-full h-full rounded-lg transition-all duration-300", {
        "ring-2 ring-success shadow-[0_0_0_2px_var(--success),0_0_20px_var(--success-glow)] animate-pulse-speaker": isSpeaking && !isMuted,
      })}
    >
      {children}
    </div>
  );
}
