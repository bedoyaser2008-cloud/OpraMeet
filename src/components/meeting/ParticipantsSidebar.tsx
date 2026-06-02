"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Mic, MicOff, Video, VideoOff, Shield, ShieldAlert, UserMinus, VolumeX, CameraOff } from "lucide-react";
import clsx from "clsx";

interface Participant {
  peerId: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHost?: boolean;
  isCoHost?: boolean;
}

interface ParticipantsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  peers: Participant[];
  myPeerId: string;
  myDisplayName: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isHost: boolean;
  coHosts: string[];
  onMuteParticipant: (peerId: string) => void;
  onDisableCamera: (peerId: string) => void;
  onRemoveParticipant: (peerId: string) => void;
  onAddCoHost: (peerId: string) => void;
  onTransferHost: (peerId: string) => void;
}

/**
 * Slide-in participant roster. Enables host administrative operations.
 */
export function ParticipantsSidebar({
  isOpen,
  onClose,
  peers,
  myPeerId,
  myDisplayName,
  isMicOn,
  isCameraOn,
  isHost,
  coHosts,
  onMuteParticipant,
  onDisableCamera,
  onRemoveParticipant,
  onAddCoHost,
  onTransferHost,
}: ParticipantsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  // Build full list including local user
  const allParticipants = useMemo(() => {
    const list: Participant[] = [
      {
        peerId: myPeerId,
        name: myDisplayName,
        isMuted: !isMicOn,
        isCameraOff: !isCameraOn,
        isHost: isHost,
        isCoHost: coHosts.includes(myPeerId),
      },
    ];

    peers.forEach((p) => {
      list.push({
        peerId: p.peerId,
        name: p.name,
        isMuted: p.isMuted,
        isCameraOff: p.isCameraOff,
        isHost: false,
        isCoHost: coHosts.includes(p.peerId),
      });
    });

    // Sort: Host first, then Co-hosts, then alphabetical
    return list.sort((a, b) => {
      if (a.isHost) return -1;
      if (b.isHost) return 1;
      if (a.isCoHost && !b.isCoHost) return -1;
      if (!a.isCoHost && b.isCoHost) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [peers, myPeerId, myDisplayName, isMicOn, isCameraOn, isHost, coHosts]);

  // Filter list by query
  const filteredParticipants = allParticipants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed top-0 right-0 h-full w-full md:w-[360px] bg-bg-surface border-l border-border-subtle z-sidebar flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border-default">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">People</h2>
          <span className="px-2 py-0.5 rounded-full bg-bg-elevated text-[11px] font-bold text-text-secondary">
            {allParticipants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Participants Panel"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all text-text-secondary cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Roster Search Bar */}
      <div className="p-4 border-b border-border-subtle relative flex items-center">
        <Search className="w-4 h-4 text-text-tertiary absolute left-7 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for people..."
          className="w-full pl-10 pr-4 py-2 bg-bg-elevated/40 hover:bg-bg-elevated/80 border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
        />
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        <AnimatePresence>
          {filteredParticipants.map((p, index) => {
            const initials = p.name
              ? p.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
              : "?";
            const isLocal = p.peerId === myPeerId;
            const canModerate = isHost && !isLocal;

            return (
              <motion.div
                key={p.peerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 group transition-all"
              >
                {/* Profile info column */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-text-secondary select-none">
                    {initials}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                        {p.name}
                      </span>
                      {isLocal && (
                        <span className="text-[10px] text-text-tertiary">(You)</span>
                      )}
                    </div>
                    
                    {/* Admin roles badge */}
                    <div className="flex items-center gap-1">
                      {p.isHost && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-bold">
                          <Shield className="w-2.5 h-2.5" /> Host
                        </span>
                      )}
                      {p.isCoHost && !p.isHost && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[9px] font-bold">
                          <ShieldAlert className="w-2.5 h-2.5" /> Co-host
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status indicator row */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2 mr-2">
                    {p.isMuted ? (
                      <MicOff className="w-4.5 h-4.5 text-danger opacity-75" />
                    ) : (
                      <Mic className="w-4.5 h-4.5 text-success opacity-75 animate-pulse" />
                    )}
                    {p.isCameraOff ? (
                      <VideoOff className="w-4.5 h-4.5 text-danger opacity-75" />
                    ) : (
                      <Video className="w-4.5 h-4.5 text-success opacity-75" />
                    )}
                  </div>

                  {/* Administrative actions (Host controls) visible on hover */}
                  {canModerate && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Mute action */}
                      {!p.isMuted && (
                        <button
                          onClick={() => onMuteParticipant(p.peerId)}
                          title="Mute Participant"
                          className="w-7 h-7 rounded-lg bg-bg-elevated hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-rose-400 cursor-pointer"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Disable camera action */}
                      {!p.isCameraOff && (
                        <button
                          onClick={() => onDisableCamera(p.peerId)}
                          title="Turn off Camera"
                          className="w-7 h-7 rounded-lg bg-bg-elevated hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-rose-400 cursor-pointer"
                        >
                          <CameraOff className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Appoint Co-host action */}
                      {!p.isCoHost && (
                        <button
                          onClick={() => onAddCoHost(p.peerId)}
                          title="Make Co-host"
                          className="w-7 h-7 rounded-lg bg-bg-elevated hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-cyan-400 cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Eject participant */}
                      <button
                        onClick={() => onRemoveParticipant(p.peerId)}
                        title="Remove Participant"
                        className="w-7 h-7 rounded-lg bg-danger/10 hover:bg-danger/20 flex items-center justify-center text-danger cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
