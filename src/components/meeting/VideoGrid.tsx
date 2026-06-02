"use client";

import { motion, AnimatePresence } from "framer-motion";
import { VideoTile } from "./VideoTile";
import { SpeakerIndicator } from "./SpeakerIndicator";
import { LayoutMode } from "@/lib/constants";
import { useState, useMemo } from "react";
import clsx from "clsx";

interface VideoGridProps {
  peers: any[];
  remoteStreams: Map<string, MediaStream>;
  localStream: MediaStream | null;
  myPeerId: string;
  displayName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isLocalSpeaking: boolean;
  pinnedPeerId: string | null;
  setPinnedPeerId: (id: string | null) => void;
  screenStream: MediaStream | null;
  layoutMode: LayoutMode;
  activeSpeakerId: string | null;
}

/**
 * Responsive meeting video grid supporting four layout modes.
 * Choreographed tile sizing, screen sharing focus, and smooth animations.
 */
export function VideoGrid({
  peers,
  remoteStreams,
  localStream,
  myPeerId,
  displayName,
  isMicOn,
  isCameraOn,
  isLocalSpeaking,
  pinnedPeerId,
  setPinnedPeerId,
  screenStream,
  layoutMode,
  activeSpeakerId,
}: VideoGridProps) {
  // Build list of all participant tiles
  const allTiles = useMemo(() => {
    const list = [];
    
    // Add local user
    list.push({
      id: myPeerId,
      name: displayName,
      stream: localStream,
      isLocal: true,
      isMuted: !isMicOn,
      isCameraOff: !isCameraOn,
      isSpeaking: isLocalSpeaking,
    });

    // Add remote peers
    peers.forEach((p) => {
      const stream = remoteStreams.get(p.peerId) || null;
      list.push({
        id: p.peerId,
        name: p.displayName,
        stream,
        isLocal: false,
        isMuted: p.isMuted,
        isCameraOff: p.isCameraOff,
        isSpeaking: p.peerId === activeSpeakerId,
      });
    });

    return list;
  }, [peers, remoteStreams, localStream, myPeerId, displayName, isMicOn, isCameraOn, isLocalSpeaking, activeSpeakerId]);

  // Determine focus / spotlight target
  const focusedTile = useMemo(() => {
    // 1. Screen sharing is always primary focus
    if (screenStream) {
      return {
        id: "screen-share",
        name: "Presentation",
        stream: screenStream,
        isLocal: true,
        isMuted: true,
        isCameraOff: false,
        isSpeaking: false,
        isScreenShare: true,
      };
    }
    // 2. Explicit pinned peer
    if (pinnedPeerId) {
      const pinTarget = allTiles.find((t) => t.id === pinnedPeerId);
      if (pinTarget) return pinTarget;
    }
    // 3. Active speaker in spotlight mode
    if (layoutMode === "spotlight" && activeSpeakerId) {
      const speakerTarget = allTiles.find((t) => t.id === activeSpeakerId);
      if (speakerTarget) return speakerTarget;
    }
    return null;
  }, [screenStream, pinnedPeerId, layoutMode, activeSpeakerId, allTiles]);

  // Filter remaining tiles for sidebar/secondary strip when a focused tile exists
  const secondaryTiles = useMemo(() => {
    if (!focusedTile) return allTiles;
    // Exclude the focused participant from secondary rows (screen-share is not in allTiles list)
    return allTiles.filter((t) => t.id !== focusedTile.id);
  }, [focusedTile, allTiles]);

  // Dynamic grid column formatting for standard Tiled view
  const gridClasses = useMemo(() => {
    const total = allTiles.length;
    if (total <= 1) return "grid-cols-1";
    if (total === 2) return "grid-cols-1 md:grid-cols-2";
    if (total <= 4) return "grid-cols-2";
    if (total <= 6) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-3 xl:grid-cols-4";
  }, [allTiles.length]);

  return (
    <div className="relative flex-1 w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden select-none bg-bg-meeting">
      <AnimatePresence mode="popLayout">
        {focusedTile ? (
          /* Focused Spotlight Layout Structure */
          <motion.div
            key="focused-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              "w-full h-full flex gap-3",
              layoutMode === "sidebar" ? "flex-col md:flex-row" : "flex-col"
            )}
          >
            {/* Main Stage */}
            <div className="flex-1 min-w-0 min-h-0 relative">
              {focusedTile.id === "screen-share" ? (
                <div className="w-full h-full bg-black rounded-lg overflow-hidden border border-border-default flex flex-col">
                  {/* Presentation Stream Renderer */}
                  <video
                    ref={(el) => {
                      if (el && el.srcObject !== screenStream) {
                        el.srcObject = screenStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs text-cyan-400 font-medium">
                    You are presenting
                  </div>
                </div>
              ) : (
                <SpeakerIndicator isSpeaking={focusedTile.isSpeaking} isMuted={focusedTile.isMuted}>
                  <VideoTile
                    peerId={focusedTile.id}
                    displayName={focusedTile.name}
                    stream={focusedTile.stream}
                    isLocal={focusedTile.isLocal}
                    isMuted={focusedTile.isMuted}
                    isCameraOff={focusedTile.isCameraOff}
                    isSpeaking={focusedTile.isSpeaking}
                    isPinned={pinnedPeerId === focusedTile.id}
                    onPinToggle={() => setPinnedPeerId(pinnedPeerId === focusedTile.id ? null : focusedTile.id)}
                  />
                </SpeakerIndicator>
              )}
            </div>

            {/* Secondary strip */}
            <div
              className={clsx(
                "flex gap-3 overflow-auto",
                layoutMode === "sidebar"
                  ? "flex-row md:flex-col w-full md:w-64 max-h-none md:max-h-full"
                  : "flex-row h-32 md:h-44 w-full"
              )}
            >
              {secondaryTiles.map((tile) => (
                <div
                  key={tile.id}
                  className={clsx(
                    "flex-shrink-0 relative",
                    layoutMode === "sidebar" ? "w-40 md:w-full h-28 md:h-36" : "w-44 md:w-56 h-full"
                  )}
                >
                  <SpeakerIndicator isSpeaking={tile.isSpeaking} isMuted={tile.isMuted}>
                    <VideoTile
                      peerId={tile.id}
                      displayName={tile.name}
                      stream={tile.stream}
                      isLocal={tile.isLocal}
                      isMuted={tile.isMuted}
                      isCameraOff={tile.isCameraOff}
                      isSpeaking={tile.isSpeaking}
                      isPinned={pinnedPeerId === tile.id}
                      onPinToggle={() => setPinnedPeerId(pinnedPeerId === tile.id ? null : tile.id)}
                    />
                  </SpeakerIndicator>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Standard Equal Grid Layout */
          <motion.div
            key="equal-grid-layout"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={clsx("w-full h-full grid gap-3 p-1 min-h-0 min-w-0", gridClasses)}
          >
            {allTiles.map((tile) => (
              <div key={tile.id} className="relative min-w-0 min-h-0 w-full h-full">
                <SpeakerIndicator isSpeaking={tile.isSpeaking} isMuted={tile.isMuted}>
                  <VideoTile
                    peerId={tile.id}
                    displayName={tile.name}
                    stream={tile.stream}
                    isLocal={tile.isLocal}
                    isMuted={tile.isMuted}
                    isCameraOff={tile.isCameraOff}
                    isSpeaking={tile.isSpeaking}
                    isPinned={pinnedPeerId === tile.id}
                    onPinToggle={() => setPinnedPeerId(pinnedPeerId === tile.id ? null : tile.id)}
                  />
                </SpeakerIndicator>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
