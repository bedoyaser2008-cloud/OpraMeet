import { fetchRoom } from "@/database/repository";
import { RoomGate } from "./RoomGate";
import Link from "next/link";
import { VideoOff, AlertTriangle } from "lucide-react";
import crypto from "crypto";

export const revalidate = 0; // Disable Next.js caching for dynamic room validation

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

/**
 * Server page component for OpraMeet meeting rooms.
 * Checks sheet records and renders 404 or ended screens before loading client session.
 */
export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  const room = await fetchRoom(roomId);

  // 1. Room not found state
  if (!room) {
    return (
      <div className="min-h-screen bg-bg-app text-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mb-4 shadow-md">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-base font-bold">Meeting Not Found</h1>
        <p className="text-xs text-text-secondary mt-1.5 max-w-xs leading-normal">
          The code you entered does not match any active meeting session.
        </p>
        <Link
          href="/"
          className="mt-6 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-on-accent text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // 2. Room ended state
  if (room.endedAt) {
    return (
      <div className="min-h-screen bg-bg-app text-text-primary flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mb-4 shadow-md">
          <VideoOff className="w-8 h-8" />
        </div>
        <h1 className="text-base font-bold">Meeting Has Ended</h1>
        <p className="text-xs text-text-secondary mt-1.5 max-w-xs leading-normal">
          This session was closed by the host on {new Date(room.endedAt).toLocaleString()}.
        </p>
        <Link
          href="/"
          className="mt-6 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-on-accent text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Generate host secret hash to pass securely (non-reversible)
  const dbHostIdHash = crypto.createHash("sha256").update(room.hostId).digest("hex");

  // 3. Room valid: load entry gate client wrapper
  return (
    <RoomGate
      roomId={room.roomId}
      isPrivate={room.isPrivate}
      waitingRoom={room.waitingRoom}
      dbHostIdHash={dbHostIdHash}
    />
  );
}
