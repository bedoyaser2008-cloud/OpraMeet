"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[]; // List of peerIds
}

/**
 * Hook to manage breakout rooms, assignments, and coordination between clients.
 */
export function useBreakoutRooms(
  roomId: string,
  peers: any[],
  dataChannel: any
) {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [activeBreakoutId, setActiveBreakoutId] = useState<string | null>(null);

  // Generates breakout room options
  const createRooms = useCallback((count: number, names?: string[]) => {
    const newRooms: BreakoutRoom[] = [];
    for (let i = 0; i < count; i++) {
      newRooms.push({
        id: `breakout-${i + 1}`,
        name: names?.[i] || `Breakout Room ${i + 1}`,
        participants: [],
      });
    }
    setRooms(newRooms);
    
    // Broadcast config to all participants
    dataChannel?.sendMessage("breakout-config", { rooms: newRooms });
  }, [dataChannel]);

  // Assigns a participant to a specific breakout room
  const assignParticipant = useCallback((peerId: string, breakoutId: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === breakoutId) {
          return {
            ...room,
            participants: room.participants.includes(peerId)
              ? room.participants
              : [...room.participants, peerId],
          };
        } else {
          return {
            ...room,
            participants: room.participants.filter((p) => p !== peerId),
          };
        }
      })
    );
  }, []);

  // Performs round-robin auto assignment
  const autoAssign = useCallback(() => {
    if (rooms.length === 0 || peers.length === 0) return;
    
    const nextRooms = rooms.map(r => ({ ...r, participants: [] as string[] }));
    peers.forEach((peer, index) => {
      const roomIndex = index % nextRooms.length;
      nextRooms[roomIndex].participants.push(peer.peerId);
    });

    setRooms(nextRooms);
    dataChannel?.sendMessage("breakout-config", { rooms: nextRooms });
  }, [rooms, peers, dataChannel]);

  const joinRoom = useCallback((breakoutId: string) => {
    setActiveBreakoutId(breakoutId);
    toast.success(`Joining breakout: ${breakoutId}`);
  }, []);

  const closeRooms = useCallback((countdownSecs = 10) => {
    toast(`Closing breakout rooms. Returning to lobby in ${countdownSecs}s...`, { icon: "⏳" });
    dataChannel?.sendMessage("breakout-close", { countdownSecs });
    
    setTimeout(() => {
      setActiveBreakoutId(null);
      setRooms([]);
      toast.success("Returned to main session");
    }, countdownSecs * 1000);
  }, [dataChannel]);

  const broadcastMessage = useCallback((message: string) => {
    dataChannel?.sendMessage("breakout-broadcast", { message });
    toast.success("Broadcast message sent to all rooms");
  }, [dataChannel]);

  // Synchronize configs via data channel listener
  useEffect(() => {
    if (!dataChannel) return;

    const unbindConfig = dataChannel.onMessage("breakout-config", (payload: any) => {
      setRooms(payload.rooms);
      
      const myId = dataChannel.myPeerId || peers[0]?.peerId; // Fallback helper
      const myAssignment = payload.rooms.find((room: BreakoutRoom) =>
        room.participants.includes(myId)
      );
      
      if (myAssignment && activeBreakoutId !== myAssignment.id) {
        joinRoom(myAssignment.id);
      }
    });

    const unbindClose = dataChannel.onMessage("breakout-close", (payload: any) => {
      const { countdownSecs } = payload;
      toast(`Closing breakout rooms in ${countdownSecs}s. Returning to main session...`, { icon: "⏳" });
      
      setTimeout(() => {
        setActiveBreakoutId(null);
        setRooms([]);
      }, countdownSecs * 1000);
    });

    const unbindBroadcast = dataChannel.onMessage("breakout-broadcast", (payload: any) => {
      toast(`[Broadcast] ${payload.message}`, { duration: 6000, icon: "📢" });
    });

    return () => {
      unbindConfig();
      unbindClose();
      unbindBroadcast();
    };
  }, [dataChannel, activeBreakoutId, joinRoom, peers]);

  return {
    rooms,
    createRooms,
    assignParticipant,
    autoAssign,
    joinRoom,
    closeRooms,
    broadcastMessage,
    activeBreakoutId,
  };
}
