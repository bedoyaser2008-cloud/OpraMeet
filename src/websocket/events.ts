export const SIGNAL_EVENTS = {
  // WebRTC Signaling Handshake
  PEER_OFFER: "client-peer-offer",
  PEER_ANSWER: "client-peer-answer",
  ICE_CANDIDATE: "client-ice-candidate",
  
  // Client Interactions (DataChannel fallbacks)
  CHAT: "client-chat",
  REACTION: "client-reaction",
  HAND_RAISE: "client-hand-raise",
  HAND_LOWER: "client-hand-lower",
  POLL_CREATE: "client-poll-create",
  POLL_VOTE: "client-poll-vote",
  POLL_CLOSE: "client-poll-close",
  WHITEBOARD_DRAW: "client-whiteboard-draw",
  CAPTION: "client-caption",
  
  // Host Control Signals
  HOST_KICK: "client-host-kick",
  HOST_MUTE: "client-host-mute",
  HOST_DISABLE_CAM: "client-host-disable-cam",
  HOST_LOCK: "client-host-lock",
  HOST_UNLOCK: "client-host-unlock",
  HOST_END: "client-host-end",
  HOST_TRANSFER: "client-host-transfer",
  COHOST_ADD: "client-cohost-add",
  PERMISSION_UPDATE: "client-permission-update",
  
  // State Synchronization
  STATE_SYNC: "client-state-sync",
} as const;

export type SignalEvent = typeof SIGNAL_EVENTS[keyof typeof SIGNAL_EVENTS];
