"use client";

import { useState } from "react";
import { X, Play, StopCircle, RefreshCw, Send, Users } from "lucide-react";
import toast from "react-hot-toast";

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
}

interface Participant {
  peerId: string;
  name: string;
}

interface BreakoutRoomsProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: BreakoutRoom[];
  peers: Participant[];
  onCreateRooms: (count: number) => void;
  onAssignParticipant: (peerId: string, roomId: string) => void;
  onAutoAssign: () => void;
  onCloseRooms: () => void;
  onBroadcastMessage: (msg: string) => void;
  activeBreakoutId: string | null;
  isHost: boolean;
}

/**
 * BreakoutRooms panel renders controls to set up breakout sessions,
 * assign participants, view active groups, and broadcast announcements.
 */
export function BreakoutRooms({
  isOpen,
  onClose,
  rooms,
  peers,
  onCreateRooms,
  onAssignParticipant,
  onAutoAssign,
  onCloseRooms,
  onBroadcastMessage,
  activeBreakoutId,
  isHost,
}: BreakoutRoomsProps) {
  const [roomCount, setRoomCount] = useState(2);
  const [broadcastText, setBroadcastText] = useState("");

  const handleCreate = () => {
    if (roomCount < 2 || roomCount > 20) {
      toast.error("Can only create between 2 and 20 rooms");
      return;
    }
    onCreateRooms(roomCount);
    toast.success(`Created ${roomCount} breakout configurations`);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onBroadcastMessage(broadcastText.trim());
    setBroadcastText("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-bg-surface w-full max-w-2xl rounded-2xl border border-border-default shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border-default bg-bg-app/40">
          <h2 className="text-sm font-semibold text-text-primary">Breakout Rooms</h2>
          <button
            onClick={onClose}
            aria-label="Close Breakout Panel"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-secondary active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {activeBreakoutId && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-xs text-amber-400">
              You are currently inside breakout session: <strong>{activeBreakoutId}</strong>
            </div>
          )}

          {rooms.length === 0 ? (
            /* Creation configuration setup (Host) */
            isHost ? (
              <div className="flex flex-col gap-5 max-w-md mx-auto py-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="room-count" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Number of Breakout Rooms
                  </label>
                  <input
                    id="room-count"
                    type="number"
                    min={2}
                    max={20}
                    value={roomCount}
                    onChange={(e) => setRoomCount(parseInt(e.target.value, 10))}
                    className="px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary transition-all"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  className="py-2.5 rounded-xl bg-accent-primary hover:bg-accent-hover text-text-on-accent text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Setup Rooms</span>
                </button>
              </div>
            ) : (
              <div className="text-center text-text-tertiary py-10">
                <Users className="w-12 h-12 opacity-35 mx-auto mb-2" />
                <p className="text-xs">No active breakout sessions configured by the host.</p>
              </div>
            )
          ) : (
            /* Active rooms configuration / management panel */
            <div className="flex flex-col gap-5">
              {/* Host actions row */}
              {isHost && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={onAutoAssign}
                      className="px-3.5 py-2 bg-bg-elevated hover:bg-white/5 border border-border-subtle rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Auto Assign</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={onCloseRooms}
                    className="px-3.5 py-2 bg-danger hover:bg-danger-hover text-white rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Close All Rooms</span>
                  </button>
                </div>
              )}

              {/* Grid of rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 bg-bg-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-text-primary truncate">
                        {room.name}
                      </span>
                      <span className="text-[10px] text-text-tertiary font-mono">
                        {room.participants.length} assigned
                      </span>
                    </div>

                    {/* Assigned user list */}
                    <div className="flex-1 min-h-[80px] max-h-[140px] overflow-y-auto flex flex-col gap-1.5">
                      {room.participants.length === 0 ? (
                        <span className="text-[11px] text-text-tertiary italic p-1">No one assigned</span>
                      ) : (
                        room.participants.map((pid) => {
                          const peer = peers.find((p) => p.peerId === pid);
                          const name = peer ? peer.name : `User_${pid.substring(0, 4)}`;
                          return (
                            <div
                              key={pid}
                              className="text-xs text-text-secondary bg-bg-app/40 px-2.5 py-1 rounded-lg border border-white/5 flex items-center justify-between"
                            >
                              <span className="truncate max-w-[150px]">{name}</span>
                              {isHost && (
                                <button
                                  onClick={() => onAssignParticipant(pid, "")}
                                  className="text-[10px] text-danger hover:underline cursor-pointer"
                                >
                                  Unassign
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Unassigned users checklists (Host view) */}
                    {isHost && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                          Assign Participant
                        </span>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignParticipant(e.target.value, room.id);
                            }
                          }}
                          className="w-full px-2 py-1 bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-primary cursor-pointer focus:outline-none"
                        >
                          <option value="">-- Select --</option>
                          {peers
                            .filter(
                              (p) =>
                                !rooms.some((r) => r.participants.includes(p.peerId))
                            )
                            .map((p) => (
                              <option key={p.peerId} value={p.peerId}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Host Broadcast form */}
              {isHost && (
                <form
                  onSubmit={handleBroadcast}
                  className="mt-4 border-t border-border-subtle pt-4 flex gap-2.5 items-center"
                >
                  <input
                    type="text"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Broadcast message to all breakout sessions..."
                    className="flex-1 px-4 py-2 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-xs text-text-primary transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-on-accent text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-app/40 border-t border-border-default flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-primary hover:bg-accent-hover text-text-on-accent transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
