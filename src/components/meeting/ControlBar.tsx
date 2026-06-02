"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Smile,
  Users,
  MessageSquare,
  MoreVertical,
  Phone,
  LayoutGrid,
  Settings,
  ClosedCaption,
  Radio,
  Palette,
  BarChart3,
  HelpCircle,
  Sparkles,
  Split,
} from "lucide-react";
import clsx from "clsx";
import { REACTION_EMOJIS, LayoutMode } from "@/lib/constants";

interface ControlBarProps {
  isMicOn: boolean;
  toggleMic: () => void;
  isCameraOn: boolean;
  toggleCamera: () => void;
  isSharing: boolean;
  toggleScreenShare: () => void;
  isHandRaised: boolean;
  toggleHand: () => void;
  isRecording: boolean;
  toggleRecording: () => void;
  isCaptionsOn: boolean;
  toggleCaptions: () => void;
  activeSidebar: string | null;
  setActiveSidebar: (sidebar: string | null) => void;
  unreadChatCount: number;
  participantCount: number;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  onSendReaction: (emoji: string) => void;
  onEndCall: () => void;
  isHost?: boolean;
}

/**
 * Premium glassmorphic toolbar with micro-animations and active status triggers.
 */
export function ControlBar({
  isMicOn,
  toggleMic,
  isCameraOn,
  toggleCamera,
  isSharing,
  toggleScreenShare,
  isHandRaised,
  toggleHand,
  isRecording,
  toggleRecording,
  isCaptionsOn,
  toggleCaptions,
  activeSidebar,
  setActiveSidebar,
  unreadChatCount,
  participantCount,
  layoutMode,
  setLayoutMode,
  onSendReaction,
  onEndCall,
  isHost = false,
}: ControlBarProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const toggleSidebar = (name: string) => {
    setActiveSidebar(activeSidebar === name ? null : name);
  };

  const handleReactionClick = (emoji: string) => {
    onSendReaction(emoji);
    setShowReactionPicker(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-control flex items-center gap-3">
      {/* 1. Main Action Pill Container */}
      <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-glass-border shadow-xl backdrop-blur-xl bg-glass-bg">
        {/* Toggle Audio */}
        <button
          onClick={toggleMic}
          aria-label={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
            isMicOn ? "bg-bg-elevated text-text-primary" : "bg-danger text-white border-none"
          )}
        >
          {isMicOn ? <Mic className="w-[18px] h-[18px]" /> : <MicOff className="w-[18px] h-[18px]" />}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={toggleCamera}
          aria-label={isCameraOn ? "Disable Camera" : "Enable Camera"}
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
            isCameraOn ? "bg-bg-elevated text-text-primary" : "bg-danger text-white border-none"
          )}
        >
          {isCameraOn ? <Video className="w-[18px] h-[18px]" /> : <VideoOff className="w-[18px] h-[18px]" />}
        </button>

        {/* Toggle Screen Share */}
        <button
          onClick={toggleScreenShare}
          aria-label={isSharing ? "Stop Screen Share" : "Share Screen"}
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
            isSharing ? "bg-accent-primary text-white border-none" : "bg-bg-elevated text-text-primary"
          )}
        >
          <Monitor className="w-[18px] h-[18px]" />
        </button>

        {/* Toggle Hand Raise */}
        <button
          onClick={toggleHand}
          aria-label={isHandRaised ? "Lower Hand" : "Raise Hand"}
          className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
            isHandRaised ? "bg-warning text-gray-950 border-none" : "bg-bg-elevated text-text-primary"
          )}
        >
          <Hand className="w-[18px] h-[18px]" />
        </button>

        {/* Reaction Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker((p) => !p)}
            aria-label="Send Reaction Emoji"
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
              showReactionPicker ? "bg-bg-elevated text-accent-primary border-accent-primary" : "bg-bg-elevated text-text-primary"
            )}
          >
            <Smile className="w-[18px] h-[18px]" />
          </button>
          
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 glass border border-glass-border rounded-xl p-2 flex items-center gap-1.5 shadow-2xl bg-bg-surface z-overlay"
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 active:scale-90 transition-all duration-100 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Chat */}
        <button
          onClick={() => toggleSidebar("chat")}
          aria-label="Toggle Message Chat Panel"
          className={clsx(
            "relative w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
            activeSidebar === "chat" ? "bg-white/15 text-accent-primary border-accent-primary" : "bg-bg-elevated text-text-primary"
          )}
        >
          <MessageSquare className="w-[18px] h-[18px]" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Toggle Participants */}
        <button
          onClick={() => toggleSidebar("participants")}
          aria-label="Toggle Meeting Members Panel"
          className={clsx(
            "relative w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
            activeSidebar === "participants" ? "bg-white/15 text-accent-primary border-accent-primary" : "bg-bg-elevated text-text-primary"
          )}
        >
          <Users className="w-[18px] h-[18px]" />
          <span className="absolute -top-1 -right-1 flex h-4 w-5 items-center justify-center rounded-full bg-gray-900 border border-white/10 text-[9px] font-bold text-text-secondary">
            {participantCount}
          </span>
        </button>

        {/* More Actions Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu((m) => !m)}
            aria-label="More options"
            className={clsx(
              "w-11 h-11 rounded-full flex items-center justify-center border border-white/5 shadow transition-all duration-200 cursor-pointer active:scale-95 hover:brightness-110",
              showMoreMenu ? "bg-bg-elevated text-accent-primary" : "bg-bg-elevated text-text-primary"
            )}
          >
            <MoreVertical className="w-[18px] h-[18px]" />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute bottom-14 right-0 w-52 glass border border-glass-border rounded-xl py-2.5 shadow-2xl bg-bg-surface z-overlay text-text-primary"
              >
                {/* Toggle Captions */}
                <button
                  onClick={() => {
                    toggleCaptions();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <ClosedCaption className={clsx("w-4 h-4", isCaptionsOn ? "text-success" : "text-text-secondary")} />
                  <span>{isCaptionsOn ? "Disable Captions" : "Enable Captions"}</span>
                </button>

                {/* Toggle Recording */}
                <button
                  onClick={() => {
                    toggleRecording();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <Radio className={clsx("w-4 h-4", isRecording ? "text-danger animate-pulse" : "text-text-secondary")} />
                  <span>{isRecording ? "Stop Recording" : "Record Meeting"}</span>
                </button>

                {/* Change layout */}
                <div className="border-t border-white/5 my-1.5" />
                
                <div className="px-4 py-1 text-[11px] font-semibold tracking-wider text-text-tertiary uppercase">
                  Layout mode
                </div>

                {(["auto", "tiled", "spotlight", "sidebar"] as LayoutMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setLayoutMode(mode);
                      setShowMoreMenu(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-1.5 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left capitalize cursor-pointer",
                      layoutMode === mode ? "text-accent-primary font-medium" : "text-text-secondary"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 opacity-60" />
                    <span>{mode}</span>
                  </button>
                ))}

                {/* Visual features and panels */}
                <div className="border-t border-white/5 my-1.5" />

                <button
                  onClick={() => {
                    toggleSidebar("whiteboard");
                    setShowMoreMenu(false);
                  }}
                  className={clsx(
                    "w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer",
                    activeSidebar === "whiteboard" ? "text-accent-primary" : "text-text-secondary"
                  )}
                >
                  <Palette className="w-4 h-4" />
                  <span>Whiteboard</span>
                </button>

                <button
                  onClick={() => {
                    toggleSidebar("polls");
                    setShowMoreMenu(false);
                  }}
                  className={clsx(
                    "w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer",
                    activeSidebar === "polls" ? "text-accent-primary" : "text-text-secondary"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Polls</span>
                </button>

                <button
                  onClick={() => {
                    toggleSidebar("qa");
                    setShowMoreMenu(false);
                  }}
                  className={clsx(
                    "w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer",
                    activeSidebar === "qa" ? "text-accent-primary" : "text-text-secondary"
                  )}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Q&A</span>
                </button>

                <button
                  onClick={() => {
                    toggleSidebar("background");
                    setShowMoreMenu(false);
                  }}
                  className={clsx(
                    "w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer",
                    activeSidebar === "background" ? "text-accent-primary" : "text-text-secondary"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Virtual Background</span>
                </button>

                {isHost && (
                  <button
                    onClick={() => {
                      toggleSidebar("breakout");
                      setShowMoreMenu(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer",
                      activeSidebar === "breakout" ? "text-accent-primary" : "text-text-secondary"
                    )}
                  >
                    <Split className="w-4 h-4" />
                    <span>Breakout Rooms</span>
                  </button>
                )}

                {/* Quick settings trigger */}
                <div className="border-t border-white/5 my-1.5" />
                <button
                  onClick={() => {
                    toggleSidebar("settings");
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 text-sm hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-text-secondary" />
                  <span>Settings</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rotated Phone call End button */}
        <button
          onClick={onEndCall}
          aria-label="End Meeting Call"
          className="w-[72px] h-11 rounded-full flex items-center justify-center bg-danger hover:bg-danger-hover text-white transition-all duration-200 cursor-pointer active:scale-95 shadow hover:scale-105"
        >
          <Phone className="w-[18px] h-[18px] rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
