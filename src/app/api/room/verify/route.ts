import { NextResponse } from "next/server";
import { fetchRoom } from "@/database/repository";

// Simple in-memory rate limiter for login passcode checks
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30000; // 30 seconds lockout

function getIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "anonymous";
}

/**
 * POST /api/room/verify
 * Validates a room passcode PIN with in-memory IP rate limiting.
 */
export async function POST(request: Request) {
  try {
    const ip = getIpAddress(request);
    const body = await request.json();
    const { roomId, passcodeHash } = body;

    if (!roomId || !passcodeHash) {
      return NextResponse.json(
        { error: "Missing required fields: roomId and passcodeHash" },
        { status: 400 }
      );
    }

    const now = Date.now();
    let limit = rateLimiter.get(ip);

    // Apply rate limit rules
    if (limit && now < limit.resetAt) {
      if (limit.count >= MAX_ATTEMPTS) {
        const secondsLeft = Math.ceil((limit.resetAt - now) / 1000);
        return NextResponse.json(
          {
            granted: false,
            error: "Too many verification attempts. Rate limited.",
            attemptsRemaining: 0,
            lockedUntil: limit.resetAt,
            secondsLeft,
          },
          { status: 429 }
        );
      }
    } else {
      // New window of rate limiting
      limit = { count: 0, resetAt: now + LOCK_DURATION_MS };
      rateLimiter.set(ip, limit);
    }

    const room = await fetchRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // If room is public, access is granted automatically
    if (!room.isPrivate) {
      return NextResponse.json({ granted: true });
    }

    // Verify passcode hash match
    if (room.passcodeHash === passcodeHash) {
      // Clear rate limit on successful check
      rateLimiter.delete(ip);
      return NextResponse.json({ granted: true });
    }

    // Incorrect passcode: increment count
    limit.count += 1;
    rateLimiter.set(ip, limit);

    const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - limit.count);
    return NextResponse.json(
      {
        granted: false,
        error: "Incorrect passcode PIN.",
        attemptsRemaining,
        lockedUntil: attemptsRemaining === 0 ? limit.resetAt : undefined,
      },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Error verifying room passcode:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
