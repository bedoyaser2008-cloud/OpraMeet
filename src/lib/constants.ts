export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const MAX_PARTICIPANTS = 25;
export const MAX_BREAKOUT_ROOMS = 20;
export const MAX_POLL_OPTIONS = 10;

export const KEYBOARD_SHORTCUTS = {
  m: "mute",
  v: "camera",
  s: "share",
  c: "chat",
  e: "reactions",
} as const;

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "👏", "🎉"] as const;

export type LayoutMode = "auto" | "tiled" | "spotlight" | "sidebar";

export const VIDEO_PRESETS = {
  "360p": {
    width: { ideal: 640 },
    height: { ideal: 360 },
    frameRate: { ideal: 24 },
  },
  "720p": {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  "1080p": {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
} as const;
