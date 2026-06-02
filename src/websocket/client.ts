"use client";

import Pusher from "pusher-js";

let pusherClientInstance: Pusher | null = null;

/**
 * Initializes and returns a singleton instance of the Pusher client in the browser.
 */
export function getPusherClient(): Pusher {
  if (typeof window === "undefined") {
    throw new Error("Pusher client can only be initialized on the client side");
  }
  
  if (!pusherClientInstance) {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) {
      throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER in environment variables");
    }
    
    pusherClientInstance = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: "/api/pusher/auth",
      forceTLS: true,
    });
  }
  
  return pusherClientInstance;
}

/**
 * Clean up the Pusher client instance by disconnecting it.
 */
export function disconnectPusher(): void {
  if (pusherClientInstance) {
    pusherClientInstance.disconnect();
    pusherClientInstance = null;
  }
}
