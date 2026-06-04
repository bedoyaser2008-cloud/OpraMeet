import { NextResponse } from "next/server";
import { fetchRoom, saveRoom } from "@/database/repository";
import { isValidRoomId } from "@/lib/roomId";

/**
 * POST /api/room
 * Creates a new meeting room.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, hostId, isPrivate, passcodeHash, waitingRoom } = body;

    if (!roomId || !hostId) {
      return NextResponse.json(
        { error: "Missing required fields: roomId and hostId" },
        { status: 400 }
      );
    }

    if (!isValidRoomId(roomId)) {
      return NextResponse.json(
        { error: "Invalid roomId format" },
        { status: 400 }
      );
    }

    const roomRecord = {
      roomId,
      hostId,
      isPrivate: !!isPrivate,
      passcodeHash: isPrivate ? (passcodeHash || null) : null,
      createdAt: Date.now(),
      lockedAt: null,
      waitingRoom: !!waitingRoom,
      allowedMembers: [hostId],
      endedAt: null,
    };

    await saveRoom(roomRecord);

    return NextResponse.json({ success: true, roomId });
  } catch (error: any) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/room?roomId=abc-abcd-abc
 * Fetches metadata of a room, excluding sensitive hash codes.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "Missing roomId parameter" },
        { status: 400 }
      );
    }

    if (!isValidRoomId(roomId)) {
      return NextResponse.json(
        { error: "Invalid roomId format" },
        { status: 400 }
      );
    }

    const room = await fetchRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { exists: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Exclude sensitive fields from the public response
    const { passcodeHash, hostId, allowedMembers, ...metadata } = room;

    return NextResponse.json({ exists: true, ...metadata });
  } catch (error: any) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
