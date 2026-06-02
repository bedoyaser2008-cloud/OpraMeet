"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export interface HostPermissions {
  preventUnmute: boolean;
  preventCamera: boolean;
  preventScreenShare: boolean;
}

/**
 * Hook to manage administrative controls for host in a meeting room.
 * Handles kicks, muting, co-hosting, lock states, and global room closure.
 */
export function useHostControls(
  roomId: string,
  myPeerId: string,
  isHost: boolean,
  hostSecret: string | null,
  dataChannel: any,
  pusherChannel: any
) {
  const [permissions, setPermissions] = useState<HostPermissions>({
    preventUnmute: false,
    preventCamera: false,
    preventScreenShare: false,
  });

  const [coHosts, setCoHosts] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const setPermission = useCallback((key: keyof HostPermissions, val: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev, [key]: val };
      dataChannel?.sendMessage("permission-update", { permissions: next });
      return next;
    });
    toast.success(`Permission updated: ${key} = ${val}`);
  }, [dataChannel]);

  const muteParticipant = useCallback((peerId: string) => {
    dataChannel?.sendMessage("host-mute", { targetPeerId: peerId });
    toast.success("Requested participant to mute");
  }, [dataChannel]);

  const muteAll = useCallback(() => {
    dataChannel?.sendMessage("host-mute-all", {});
    toast.success("Requested all participants to mute");
  }, [dataChannel]);

  const disableCamera = useCallback((peerId: string) => {
    dataChannel?.sendMessage("host-disable-cam", { targetPeerId: peerId });
    toast.success("Requested participant to close camera");
  }, [dataChannel]);

  // Invokes Pusher server-side trigger gateway to eject participant
  const removeParticipant = useCallback(async (peerId: string) => {
    try {
      const res = await fetch("/api/pusher/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          hostId: hostSecret,
          channel: pusherChannel?.name,
          event: "client-host-kick",
          data: { targetPeerId: peerId },
        }),
      });
      if (res.ok) {
        toast.success("Participant ejected");
      } else {
        const err = await res.json();
        toast.error(`Ejection failed: ${err.error || "Server issue."}`);
      }
    } catch (e) {
      toast.error("Network error during participant ejection");
    }
  }, [roomId, hostSecret, pusherChannel]);

  const lockRoom = useCallback(async () => {
    setIsLocked(true);
    dataChannel?.sendMessage("host-lock", { isLocked: true });
    toast.success("Meeting locked");
  }, [dataChannel]);

  const unlockRoom = useCallback(async () => {
    setIsLocked(false);
    dataChannel?.sendMessage("host-lock", { isLocked: false });
    toast.success("Meeting unlocked");
  }, [dataChannel]);

  // Closes room record in sheets database and terminates session for all clients
  const endMeeting = useCallback(async () => {
    try {
      const res = await fetch("/api/room/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, hostId: hostSecret }),
      });
      
      if (res.ok) {
        dataChannel?.sendMessage("host-end", {});
        toast.success("Meeting ended by host");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        const err = await res.json();
        toast.error(`Failed to terminate meeting: ${err.error}`);
      }
    } catch (e) {
      toast.error("Network error terminating meeting");
    }
  }, [roomId, hostSecret, dataChannel]);

  const transferHost = useCallback((peerId: string) => {
    dataChannel?.sendMessage("host-transfer", { newHostId: peerId });
    toast.success("Host ownership transferred");
  }, [dataChannel]);

  const addCoHost = useCallback((peerId: string) => {
    setCoHosts((prev) => {
      const next = [...prev, peerId];
      dataChannel?.sendMessage("cohost-add", { coHosts: next });
      return next;
    });
    toast.success("Co-host appointed");
  }, [dataChannel]);

  return {
    muteParticipant,
    muteAll,
    disableCamera,
    removeParticipant,
    lockRoom,
    unlockRoom,
    endMeeting,
    transferHost,
    addCoHost,
    permissions,
    setPermission,
    coHosts,
    isLocked,
  };
}
