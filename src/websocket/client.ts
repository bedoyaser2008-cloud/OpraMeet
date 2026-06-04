"use client";

import Pusher from "pusher-js";

let pusherClientInstance: Pusher | null = null;

// Mutable auth params that will be read dynamically by the custom authorizer
let currentAuthParams: Record<string, string> = {};

/**
 * Update the auth params that will be sent with the next Pusher channel subscription.
 * This is safe to call before subscribing to a channel.
 */
export function setAuthParams(params: Record<string, string>): void {
  currentAuthParams = { ...params };
}

/**
 * Initializes and returns a singleton instance of the Pusher client in the browser.
 * Uses a custom authorizer to ensure auth params are always current.
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
      forceTLS: true,
      // Use channelAuthorization with a custom authorizer that reads currentAuthParams at call-time
      channelAuthorization: {
        transport: "ajax",
        endpoint: "/api/pusher/auth",
        params: {},
        // paramsProvider is called fresh each time a channel needs authorization
        paramsProvider: () => {
          return { ...currentAuthParams };
        },
      },
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
  currentAuthParams = {};
}
