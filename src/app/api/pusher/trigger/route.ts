import { NextResponse } from "next/server";
import { pusherServer } from "@/websocket/config";
import { fetchRoom } from "@/database/repository";

/**
 * POST /api/pusher/trigger
 * Secure administrative signaling gateway.
 * Enforces that only the meeting host can invoke server-side triggers (like kicks, locks, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, event, data, hostId, roomId } = body;

    if (!channel || !event || !hostId || !roomId) {
      return NextResponse.json(
        { error: "Missing required parameters: channel, event, hostId, and roomId" },
        { status: 400 }
      );
    }

    // Validate the room
    const room = await fetchRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Security check: Only the host is authorized to execute server-side pusher triggers
    if (room.hostId !== hostId) {
      return NextResponse.json(
        { error: "Unauthorized: Only the host can trigger server administrative events" },
        { status: 403 }
      );
    }

    // Trigger Pusher event on target channel
    await pusherServer.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error triggering Pusher event:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
