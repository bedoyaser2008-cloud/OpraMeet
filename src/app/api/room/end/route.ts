import { NextResponse } from "next/server";
import { fetchRoom, deleteRoom } from "@/database/repository";

/**
 * POST /api/room/end
 * Soft-deletes a room by setting its endedAt timestamp. Only authorized host can perform this.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, hostId } = body;

    if (!roomId || !hostId) {
      return NextResponse.json(
        { error: "Missing required fields: roomId and hostId" },
        { status: 400 }
      );
    }

    const room = await fetchRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Security check: only the designated host can terminate a meeting
    if (room.hostId !== hostId) {
      return NextResponse.json(
        { error: "Unauthorized: Only the host can end this meeting" },
        { status: 403 }
      );
    }

    await deleteRoom(roomId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error ending room:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
