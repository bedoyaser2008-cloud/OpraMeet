import { NextResponse } from "next/server";
import { pusherServer } from "@/websocket/config";

/**
 * POST /api/pusher/auth
 * Handles subscription authentication for Pusher presence channels.
 * Supports both JSON and FormUrlEncoded payloads, and parses query parameters.
 */
export async function POST(request: Request) {
  try {
    let socketId: string | null = null;
    let channelName: string | null = null;
    let userId: string | null = null;
    let userName: string | null = null;

    const url = new URL(request.url);
    const contentType = request.headers.get("content-type") || "";

    let isWaiting = false;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      socketId = formData.get("socket_id") as string;
      channelName = formData.get("channel_name") as string;
      userId = formData.get("user_id") as string;
      userName = formData.get("user_name") as string;
      isWaiting = formData.get("is_waiting") === "true";
    } else {
      try {
        const body = await request.json();
        socketId = body.socket_id;
        channelName = body.channel_name;
        userId = body.user_id;
        userName = body.user_name;
        isWaiting = body.is_waiting === "true" || body.is_waiting === true || body.isWaiting === true;
      } catch (jsonErr) {
        // Fallback if body parsing fails
      }
    }

    // Check query params if not provided in body/formData
    userId = userId || url.searchParams.get("user_id") || url.searchParams.get("userId");
    userName = userName || url.searchParams.get("user_name") || url.searchParams.get("userName");
    if (url.searchParams.get("is_waiting") === "true" || url.searchParams.get("isWaiting") === "true") {
      isWaiting = true;
    }

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name parameters" },
        { status: 400 }
      );
    }

    // Validate that channel is a presence room or presence breakout channel
    if (!channelName.startsWith("presence-room-") && !channelName.startsWith("presence-breakout-")) {
      return NextResponse.json(
        { error: "Invalid channel name format" },
        { status: 400 }
      );
    }

    // Default info if not supplied
    const peerUserId = userId || `peer_${Math.random().toString(36).substring(2, 11)}`;
    const peerUserName = userName || `Guest_${peerUserId.substring(5, 9)}`;

    const presenceData = {
      user_id: peerUserId,
      user_info: {
        id: peerUserId,
        name: peerUserName,
        joinedAt: Date.now(),
        isWaiting,
      },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    
    return NextResponse.json(authResponse);
  } catch (error: any) {
    console.error("Error in Pusher auth:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
