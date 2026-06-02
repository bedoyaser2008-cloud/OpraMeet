import { NextResponse } from "next/server";
import { pusherServer } from "@/websocket/config";
import { fetchRoom } from "@/database/repository";
import { decryptPayload } from "@/database/crypto";

/**
 * POST /api/pusher/auth
 * Handles subscription authentication for Pusher presence channels.
 * Supports both JSON and FormUrlEncoded payloads, and parses query parameters.
 * Enforces room security policies (passcodes, waiting rooms, host authorization).
 */
export async function POST(request: Request) {
  try {
    let socketId: string | null = null;
    let channelName: string | null = null;
    let userId: string | null = null;
    let userName: string | null = null;
    let token: string | null = null;

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
      token = formData.get("token") as string;
    } else {
      try {
        const body = await request.json();
        socketId = body.socket_id;
        channelName = body.channel_name;
        userId = body.user_id;
        userName = body.user_name;
        isWaiting = body.is_waiting === "true" || body.is_waiting === true || body.isWaiting === true;
        token = body.token;
      } catch (jsonErr) {
        // Fallback if body parsing fails
      }
    }

    // Check query params if not provided in body/formData
    userId = userId || url.searchParams.get("user_id") || url.searchParams.get("userId");
    userName = userName || url.searchParams.get("user_name") || url.searchParams.get("userName");
    token = token || url.searchParams.get("token");
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

    // Parse roomId from channelName
    let roomId = "";
    if (channelName.startsWith("presence-room-")) {
      roomId = channelName.substring("presence-room-".length);
    } else if (channelName.startsWith("presence-breakout-")) {
      const parts = channelName.split("-");
      if (parts.length >= 5) {
        roomId = `${parts[2]}-${parts[3]}-${parts[4]}`;
      }
    }

    if (!roomId) {
      return NextResponse.json(
        { error: "Invalid channel name structure" },
        { status: 400 }
      );
    }

    // Fetch the room configurations
    const room = await fetchRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: "Meeting room not found" },
        { status: 404 }
      );
    }

    let isAuthorized = false;
    let isHost = false;
    let authReason = "default_unauthorized";

    console.log(`[PusherAuth] Authorizing user: ${userId} for channel: ${channelName}, room: ${roomId}`);
    console.log(`[PusherAuth] room.isPrivate: ${room.isPrivate}, room.waitingRoom: ${room.waitingRoom}, isWaiting: ${isWaiting}`);
    console.log(`[PusherAuth] token received: ${token ? (token.substring(0, 15) + "...") : "falsy"}`);

    // 1. Verify if user is the host using the secret host token
    if (token === room.hostId) {
      isAuthorized = true;
      isHost = true;
      isWaiting = false; // Host never waits
      authReason = "authorized_as_host";
    }
    // 2. Verify if user is requesting to join in "waiting" mode
    else if (isWaiting) {
      // Waiting room is only permitted if it is enabled for this room
      if (room.waitingRoom) {
        isAuthorized = true;
        authReason = "authorized_as_waiting_guest";
      } else {
        authReason = "rejected_waiting_guest_waiting_room_disabled";
      }
    }
    // 3. Verify if user is joining normally (isWaiting: false)
    else {
      // If room is private OR waiting room is enabled, they must present a valid signed peerToken
      if (room.isPrivate || room.waitingRoom) {
        if (token && token !== "undefined" && token !== "null") {
          try {
            const decoded = decryptPayload<{ roomId: string; role: string; expiresAt: number }>(token);
            if (!decoded) {
              authReason = "rejected_token_decryption_returned_null";
            } else if (decoded.roomId !== roomId) {
              authReason = `rejected_token_room_id_mismatch_decoded_${decoded.roomId}_vs_channel_${roomId}`;
            } else if (decoded.role !== "peer") {
              authReason = `rejected_token_role_mismatch_decoded_${decoded.role}`;
            } else if (decoded.expiresAt <= Date.now()) {
              authReason = `rejected_token_expired_decoded_${decoded.expiresAt}_vs_now_${Date.now()}`;
            } else {
              isAuthorized = true;
              authReason = "authorized_normally_with_valid_token";
            }
          } catch (decryptErr: any) {
            console.error("[PusherAuth] Invalid peer token decryption error:", decryptErr);
            authReason = `rejected_token_decryption_threw_error_${decryptErr.message}`;
          }
        } else {
          authReason = `rejected_token_missing_for_private_or_waiting_room_token_value_${token}`;
        }
      }
      // If room is public and has no waiting room, they are free to join
      else {
        isAuthorized = true;
        authReason = "authorized_normally_public_room_no_waiting";
      }
    }

    console.log(`[PusherAuth] Authorization result: ${isAuthorized}, reason: ${authReason}`);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized access to signaling channel", reason: authReason },
        { status: 403 }
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
        isHost,
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
