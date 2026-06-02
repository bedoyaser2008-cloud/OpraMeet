import PusherServer from "pusher";

// Create a Pusher server instance to be used exclusively in Server/API routes.
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "",
  useTLS: true,
});

/**
 * Builds the presence channel name for a specific room.
 * e.g., presence-room-abc-defg-hij
 */
export function buildRoomChannel(roomId: string): string {
  return `presence-room-${roomId}`;
}

/**
 * Builds the presence channel name for a breakout room.
 * e.g., presence-breakout-abc-defg-hij-room1
 */
export function buildBreakoutChannel(roomId: string, breakoutId: string): string {
  return `presence-breakout-${roomId}-${breakoutId}`;
}
