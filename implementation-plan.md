# OpraMeet — Implementation Plan (UI/UX Pro Max Edition)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade Google Meet clone with a premium, cinematic dark UI that goes far beyond generic video conferencing aesthetics.

**Architecture:** Next.js 14 App Router (TypeScript) with WebRTC mesh via simple-peer, Pusher Channels for signaling, Google Sheets as encrypted serverless DB, and MediaPipe for AI backgrounds. Fully deployed on Vercel.

**Tech Stack:** Next.js 14+, React 18, TypeScript, Tailwind CSS 3.4, shadcn/ui + Radix, Pusher, simple-peer, googleapis, framer-motion, lucide-react

---

> [!IMPORTANT]
> This is a massive project (~50+ files, ~10,000+ lines). Decomposed into **10 sequential phases**. Estimated: 4–6 hours with subagents.

---

## 🎨 Design System — "Dark Cinema" Aesthetic

> Applied using **frontend-design** (bold aesthetic direction) + **ui-ux-pro-max** (systematic tokens, UX rules, accessibility).

### Aesthetic Direction

**Tone:** Cinematic dark. Premium. Immersive. Not another flat grey rectangle — a space that feels *alive*.

**Concept:** A dark cinema environment where the video content is the star. The UI recedes into the darkness with frosted glass panels, subtle ambient glows, and precise micro-animations. Think: the love child of Google Meet's functionality and Arc Browser's design boldness.

**Differentiator:** The control bar *breathes* — subtle ambient glow follows active speaker. Panels slide in with spring physics. Every state transition is choreographed. The meeting room feels like a focused creative studio, not a corporate box.

### Color System (Semantic Tokens)

```css
:root {
  /* ── Primitives ── */
  --gray-950:       #0a0a0f;
  --gray-900:       #111118;
  --gray-850:       #16161f;
  --gray-800:       #1c1c27;
  --gray-700:       #2a2a3a;
  --gray-600:       #3d3d52;
  --gray-500:       #5a5a72;
  --gray-400:       #8888a0;
  --gray-300:       #b0b0c4;
  --gray-200:       #d4d4e0;
  --gray-100:       #eeeef4;

  --cyan-500:       #06b6d4;
  --cyan-400:       #22d3ee;
  --cyan-300:       #67e8f9;
  --violet-500:     #8b5cf6;
  --violet-400:     #a78bfa;
  --rose-500:       #f43f5e;
  --rose-400:       #fb7185;
  --emerald-500:    #10b981;
  --emerald-400:    #34d399;
  --amber-400:      #fbbf24;

  /* ── Semantic ── */
  --bg-app:         var(--gray-950);      /* Deepest background */
  --bg-meeting:     var(--gray-900);      /* Meeting room canvas */
  --bg-tile:        var(--gray-800);      /* Video tile background (camera off) */
  --bg-surface:     var(--gray-850);      /* Panels, sidebars */
  --bg-elevated:    var(--gray-700);      /* Dropdowns, tooltips, hover cards */
  --bg-control-bar: rgba(17, 17, 24, 0.85); /* Bottom bar — frosted */

  --accent-primary: var(--cyan-500);      /* Primary CTAs, active states */
  --accent-hover:   var(--cyan-400);      /* Hover on primary */
  --accent-glow:    rgba(6, 182, 212, 0.15); /* Ambient glow behind accent elements */
  --accent-secondary: var(--violet-500);  /* Secondary accent (breakout rooms, polls) */

  --danger:         var(--rose-500);      /* End call, muted, destructive */
  --danger-hover:   var(--rose-400);
  --success:        var(--emerald-500);   /* Active mic/cam, admitted */
  --success-glow:   rgba(16, 185, 129, 0.2);
  --warning:        var(--amber-400);     /* Network issues, recording */

  --text-primary:   var(--gray-100);      /* Main text — high contrast */
  --text-secondary: var(--gray-400);      /* Labels, timestamps */
  --text-tertiary:  var(--gray-500);      /* Placeholder, disabled */
  --text-on-accent: #ffffff;

  --border-subtle:  rgba(255, 255, 255, 0.06);  /* Panel edges */
  --border-default: rgba(255, 255, 255, 0.1);   /* Dividers */
  --border-focus:   var(--cyan-400);             /* Focus rings */

  /* ── Elevation (Glassmorphism) ── */
  --glass-bg:       rgba(22, 22, 31, 0.7);
  --glass-border:   rgba(255, 255, 255, 0.08);
  --glass-blur:     blur(24px);
  --glass-shadow:   0 8px 32px rgba(0, 0, 0, 0.4);

  /* ── Shadows (4-step scale) ── */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.5);
  --shadow-xl:  0 16px 48px rgba(0,0,0,0.6);

  /* ── Border Radius ── */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;

  /* ── Z-Index Scale ── */
  --z-base:     0;
  --z-tiles:    10;
  --z-sidebar:  20;
  --z-control:  30;
  --z-overlay:  40;
  --z-modal:    50;
  --z-toast:    60;
}
```

### Typography

**Font Pairing:** `DM Sans` (headings + UI) + `JetBrains Mono` (codes, timers, room IDs)

> DM Sans is geometric, clean, and distinctive without being generic. It has character that Inter lacks — slightly wider letterforms with humanist touches. JetBrains Mono for monospace elements (room codes, timestamps) adds a developer-tool precision feel.

```css
/* Type Scale (modular — 1.25 ratio) */
--text-xs:    0.75rem;   /* 12px — micro labels */
--text-sm:    0.875rem;  /* 14px — secondary text */
--text-base:  1rem;      /* 16px — body */
--text-lg:    1.125rem;  /* 18px — emphasis */
--text-xl:    1.25rem;   /* 20px — section headings */
--text-2xl:   1.5rem;    /* 24px — page headings */
--text-3xl:   2rem;      /* 32px — hero text */
--text-4xl:   2.5rem;    /* 40px — landing hero */

--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide:  0.04em;  /* All-caps labels */
```

### Animation Tokens

Per ui-ux-pro-max §7: spring-physics, exit-faster-than-enter, stagger-sequence, motion-meaning.

```css
/* ── Transitions ── */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);  /* Overshoot spring */
--ease-smooth:    cubic-bezier(0.25, 0.1, 0.25, 1);   /* Standard smooth */
--ease-out:       cubic-bezier(0, 0, 0.2, 1);         /* Enter */
--ease-in:        cubic-bezier(0.4, 0, 1, 1);         /* Exit */

--duration-fast:    120ms;   /* Micro: toggle, icon swap */
--duration-normal:  200ms;   /* Standard: panel, button */
--duration-slow:    300ms;   /* Complex: sidebar slide, modal */
--duration-enter:   300ms;   /* Enter always */
--duration-exit:    200ms;   /* Exit 66% of enter — feels responsive */

--stagger-delay:    40ms;    /* Per-item in lists */
```

### Spacing Rhythm

8dp system per ui-ux-pro-max §5: `spacing-scale`.

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Component-Level Design Tokens

#### Video Tile
- Background: `var(--bg-tile)` with avatar initial in `var(--text-secondary)`
- Border radius: `var(--radius-lg)` (16px)
- Active speaker: 2px `var(--success)` border with `var(--success-glow)` box-shadow, pulsing via `@keyframes` (1.5s ease-in-out infinite)
- Name label: bottom-left, `var(--text-sm)`, `DM Sans 500`, on a `rgba(0,0,0,0.6)` pill with `var(--glass-blur)`
- Hover: subtle scale(1.01) + overlay with action buttons (pin, mute, kebab menu)
- Transition: `transform var(--duration-fast) var(--ease-smooth)`

#### Control Bar
- Position: fixed bottom, `var(--z-control)`
- Background: `var(--bg-control-bar)` + `backdrop-filter: var(--glass-blur)` + `border-top: 1px solid var(--glass-border)`
- Height: 72px, centered horizontally with `max-width: fit-content`, `border-radius: var(--radius-xl)` (pill shape), `margin-bottom: 16px`
- Buttons: 48×48px touch targets (ui-ux-pro-max §2), `var(--radius-full)` circles
  - Default: `var(--bg-elevated)` background, `var(--text-primary)` icon
  - Hover: `brightness(1.15)` + subtle `scale(1.05)`
  - Active (muted/cam off): `var(--danger)` background, white strikethrough icon
  - Pressed: `scale(0.95)` for 120ms (ui-ux-pro-max §7: `scale-feedback`)
- End call button: `var(--danger)`, wider (80px), prominent
- Ambient glow: faint `var(--accent-glow)` shadow tracks active speaker position

#### Sidebar Panels (Chat, Participants, etc.)
- Width: 360px (desktop), 100% (mobile)
- Background: `var(--bg-surface)` + `border-left: 1px solid var(--border-subtle)`
- Entry animation: slide from right, `var(--duration-slow)` `var(--ease-spring)` (overshoot)
- Exit: slide right, `var(--duration-exit)` `var(--ease-in)` (faster exit per ui-ux-pro-max)
- Header: 56px height, `var(--text-lg)` `DM Sans 600`, close button right-aligned
- Content: scrollable, `scroll-behavior: smooth`

#### Modals
- Backdrop: `rgba(0, 0, 0, 0.6)` + `backdrop-filter: blur(8px)`
- Modal: `var(--bg-surface)`, `var(--radius-xl)`, `var(--shadow-xl)`
- Entry: `scale(0.95) → scale(1)` + `opacity(0 → 1)`, `var(--duration-slow)` `var(--ease-spring)`
- Exit: `scale(1 → 0.98)` + `opacity(1 → 0)`, `var(--duration-exit)` `var(--ease-in)`

#### Toast Notifications
- Position: top-right, `var(--z-toast)`
- Background: `var(--glass-bg)` + `var(--glass-blur)`, `var(--radius-md)`
- Auto-dismiss: 4 seconds (ui-ux-pro-max §8: `toast-dismiss`)
- Entry: slide down + fade, staggered if multiple
- `aria-live="polite"` for screen readers (ui-ux-pro-max §8: `toast-accessibility`)

#### Buttons (General)
- Touch target: min 44×44px (ui-ux-pro-max §2)
- Focus ring: 2px `var(--border-focus)` offset 2px (ui-ux-pro-max §1: `focus-states`)
- Disabled: `opacity(0.4)` + `cursor: not-allowed` (ui-ux-pro-max §8: `disabled-states`)
- Primary: `var(--accent-primary)` bg, `var(--text-on-accent)`, hover → `var(--accent-hover)`
- Destructive: `var(--danger)` bg, hover → `var(--danger-hover)`
- Ghost: transparent bg, `var(--text-secondary)`, hover → `var(--bg-elevated)`

### Accessibility Requirements (from ui-ux-pro-max §1)

- All text meets WCAG AA: 4.5:1 contrast minimum
- Focus rings on every interactive element (never removed)
- `aria-label` on all icon-only buttons
- Keyboard shortcuts: M, V, S, C, E (announced in tooltip)
- `prefers-reduced-motion`: disable all decorative animations, keep functional state transitions
- Screen reader: logical tab order, `aria-live` regions for dynamic content (chat, captions, toasts)
- No color-only indicators: muted = red icon + strikethrough + tooltip text

### Anti-Patterns to Avoid (from both skills)

❌ Generic Inter/Roboto fonts — using DM Sans + JetBrains Mono instead
❌ Purple-gradient-on-white syndrome — using deep dark cinema palette
❌ Flat grey rectangles — using glassmorphism + ambient glows
❌ Instant state changes (0ms) — all transitions choreographed
❌ Emoji as icons — Lucide React SVG icons throughout
❌ Placeholder-only labels — visible labels on all form inputs
❌ Hover-only interactions — all interactions work with tap/keyboard
❌ Layout-shifting animations — transform/opacity only

---

## Phase Overview

| Phase | Description | Files | Dependencies |
|-------|-------------|-------|--------------|
| **1** | Project scaffolding + design system setup | ~8 | None |
| **2** | Database layer (crypto + sheets) | 3 | Phase 1 |
| **3** | WebSocket signaling layer | 3 | Phase 1 |
| **4** | Lib utilities + middleware | 4 | Phase 1 |
| **5** | API routes | 6 | Phases 2, 3, 4 |
| **6** | Core WebRTC hooks | 4 | Phase 3 |
| **7** | Media & feature hooks | 8 | Phase 6 |
| **8** | UI components — meeting | 17 | Phases 6, 7 |
| **9** | UI components — lobby + home | 5 | Phase 8 |
| **10** | Pages + layout + final integration | 4 | All |

---

## Phase 1: Project Scaffolding + Design System Setup

### Task 1.1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`

**Steps:**
- [ ] Run `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm` (check `--help` first for exact flags)
- [ ] Install all dependencies from the spec:
  ```bash
  npm install googleapis pusher pusher-js simple-peer @types/simple-peer @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl @tensorflow/tfjs-converter @tensorflow-models/body-segmentation @mediapipe/selfie_segmentation clsx lucide-react @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-dropdown-menu react-hot-toast framer-motion
  ```
- [ ] Verify dev server starts: `npm run dev`

### Task 1.2: Tailwind configuration + design tokens

**Files:**
- Modify: `tailwind.config.ts` — extend with the complete Dark Cinema color system, typography, spacing, shadows, border-radius, z-index, and animation tokens
- Modify: `postcss.config.js` — ensure Tailwind + autoprefixer

**Steps:**
- [ ] Extend `theme.colors` with ALL semantic token colors (bg-app, bg-meeting, bg-tile, bg-surface, bg-elevated, accent-primary, accent-hover, danger, success, warning, text-primary, text-secondary, text-tertiary, etc.)
- [ ] Extend `theme.fontFamily` with `'dm-sans'` and `'jetbrains-mono'`
- [ ] Extend `theme.fontSize` with the modular type scale
- [ ] Extend `theme.spacing` with 8dp rhythm values
- [ ] Extend `theme.borderRadius` with sm/md/lg/xl/full tokens
- [ ] Extend `theme.boxShadow` with sm/md/lg/xl + glow variants
- [ ] Extend `theme.zIndex` with base/tiles/sidebar/control/overlay/modal/toast
- [ ] Add `theme.extend.animation` and `theme.extend.keyframes` for: `pulse-speaker`, `fade-in`, `slide-in-right`, `slide-out-right`, `scale-in`, `float-up` (reactions)
- [ ] Add `theme.extend.backdropBlur` for glass effects
- [ ] Add `theme.extend.transitionTimingFunction` for spring/smooth/ease-out/ease-in curves

### Task 1.3: Global CSS + design system foundation

**Files:**
- Modify: `src/app/globals.css` — complete design system CSS variables + base styles

**Steps:**
- [ ] Add ALL CSS custom properties from the Design System section above (full `:root` block)
- [ ] Add `@media (prefers-reduced-motion: reduce)` overrides: set all `--duration-*` to `0ms` except `--duration-fast` to `1ms`
- [ ] Add focus-visible global styles: `*:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }`
- [ ] Add scrollbar custom styling (thin, dark, matching theme)
- [ ] Add selection color styling (`::selection { background: var(--accent-primary); color: white; }`)
- [ ] Set `html { scroll-behavior: smooth; }` and `body { background: var(--bg-app); color: var(--text-primary); font-family: 'DM Sans', sans-serif; }`
- [ ] Add glass utility class: `.glass { background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur); box-shadow: var(--glass-shadow); }`

### Task 1.4: Root layout with fonts + providers

**Files:**
- Modify: `src/app/layout.tsx`

**Steps:**
- [ ] Import `DM_Sans` and `JetBrains_Mono` from `next/font/google`
- [ ] Set `<html lang="en" className="dark">` with font variable classes
- [ ] Add `<Toaster>` from `react-hot-toast` with dark theme config (position: top-right, bg: `var(--bg-elevated)`, color: `var(--text-primary)`)
- [ ] SEO metadata: title "OpraMeet — Video Meetings for Everyone", description, og:image, favicon
- [ ] Add viewport meta: `width=device-width, initial-scale=1` (never disable zoom — ui-ux-pro-max §5)

### Task 1.5: Environment + deployment config

**Files:**
- Create: `.env.example`
- Create: `vercel.json`
- Modify: `.gitignore`

**Steps:**
- [ ] Create `.env.example` with all placeholder variables from the spec
- [ ] Create `vercel.json` with function memory/duration config
- [ ] Ensure `.gitignore` covers `.env`, `node_modules`, `.next`

---

## Phase 2: Database Layer (`/database/`)

> Self-contained. No UI code touches this folder.

### Task 2.1: Encryption engine

**Files:**
- Create: `database/crypto.ts`

**Steps:**
- [ ] Implement `encryptPayload()` — AES-256-GCM, PBKDF2 with random salt (64 bytes), random IV (12 bytes), random iterations (10k–99k)
- [ ] Implement `decryptPayload<T>()` — reverse the packaging, return typed data
- [ ] Output format: `enc::` prefix + hex-encoded `salt|iv|authTag|iterations|ciphertext`
- [ ] Full implementation provided in the user spec — use exactly

### Task 2.2: Google Sheets connection

**Files:**
- Create: `database/connection.ts`

**Steps:**
- [ ] Implement `getSheetsClient()` using `googleapis` JWT auth
- [ ] Handle `\\n` escaping in private key
- [ ] Code exactly as specified

### Task 2.3: Repository (CRUD)

**Files:**
- Create: `database/repository.ts`

**Steps:**
- [ ] Define `RoomRecord` interface (roomId, hostId, isPrivate, passcodeHash, createdAt, lockedAt, waitingRoom, allowedMembers, endedAt)
- [ ] Implement `getAllRows()`, `fetchRoom()`, `saveRoom()`, `deleteRoom()`
- [ ] All data encrypted. `deleteRoom()` = soft-delete with `endedAt` timestamp

---

## Phase 3: WebSocket Signaling Layer (`/websocket/`)

> Fully self-contained. Swappable for Ably/PartyKit.

### Task 3.1: Server config + channel builders

**Files:**
- Create: `websocket/config.ts`

**Steps:**
- [ ] Create Pusher server instance from env vars (used in API routes only)
- [ ] Export `buildRoomChannel(roomId)` → `presence-room-${roomId}`
- [ ] Export `buildBreakoutChannel(roomId, breakoutId)` → `presence-breakout-${roomId}-${breakoutId}`

### Task 3.2: Event constants

**Files:**
- Create: `websocket/events.ts`

**Steps:**
- [ ] Export `SIGNAL_EVENTS` const with all 20+ event names
- [ ] All client events prefixed with `client-` (Pusher requirement)

### Task 3.3: Browser client factory

**Files:**
- Create: `websocket/client.ts`

**Steps:**
- [ ] `'use client'` directive
- [ ] Singleton `getPusherClient()` with auth endpoint `/api/pusher/auth`
- [ ] `disconnectPusher()` for cleanup

---

## Phase 4: Lib Utilities + Middleware

### Task 4.1: Room ID utilities

**Files:**
- Create: `src/lib/roomId.ts`

**Steps:**
- [ ] `generateRoomId()` → `abc-abcd-abc` format (lowercase alpha only)
- [ ] `ROOM_ID_REGEX` + `isValidRoomId()`

### Task 4.2: Client-side crypto

**Files:**
- Create: `src/lib/crypto-client.ts`

**Steps:**
- [ ] SHA-256 hash via `crypto.subtle.digest` (Web Crypto API, browser-safe)
- [ ] Export `hashPasscode(pin: string): Promise<string>` returning hex string

### Task 4.3: App constants

**Files:**
- Create: `src/lib/constants.ts`

**Steps:**
- [ ] STUN servers: `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302`
- [ ] Limits: `MAX_PARTICIPANTS = 25`, `MAX_BREAKOUT_ROOMS = 20`, `MAX_POLL_OPTIONS = 10`
- [ ] Keyboard shortcuts map: `{ 'm': 'mute', 'v': 'camera', 's': 'share', 'c': 'chat', 'e': 'reactions' }`
- [ ] Reaction emojis: `['👍', '❤️', '😂', '😮', '👏', '🎉']`
- [ ] Layout modes enum: `'auto' | 'tiled' | 'spotlight' | 'sidebar'`
- [ ] Video constraints for 360p/720p/1080p presets

### Task 4.4: Edge middleware

**Files:**
- Create: `src/middleware.ts`

**Steps:**
- [ ] Validate room ID format on dynamic routes using `ROOM_ID_REGEX`
- [ ] Pass through `/`, `/api/*`, `/_next/*`, static assets (files with `.`)
- [ ] Redirect invalid room IDs to `/?error=invalid-room`
- [ ] Export `config.matcher`

---

## Phase 5: API Routes

### Task 5.1: Room CRUD routes

**Files:**
- Create: `src/app/api/room/route.ts`

**Steps:**
- [ ] **POST**: Create room — receive `{ roomId, hostId, isPrivate, passcodeHash, waitingRoom }`, call `saveRoom()`, return `{ success: true, roomId }`
- [ ] **GET**: Fetch room — `?roomId=`, call `fetchRoom()`, return metadata (never return `passcodeHash`), return `{ exists, isPrivate, waitingRoom, hostId, lockedAt }`
- [ ] Validate room ID format before processing
- [ ] Proper error handling with status codes (400, 404, 500)

### Task 5.2: Room verify route

**Files:**
- Create: `src/app/api/room/verify/route.ts`

**Steps:**
- [ ] **POST**: Receive `{ roomId, passcodeHash }`, compare against stored hash
- [ ] Rate limiting: in-memory `Map<string, { count: number, resetAt: number }>`, max 5 attempts per IP per 30 seconds
- [ ] Return `{ granted: true/false, attemptsRemaining?, lockedUntil? }`

### Task 5.3: Room end route

**Files:**
- Create: `src/app/api/room/end/route.ts`

**Steps:**
- [ ] **POST**: Receive `{ roomId, hostId }`, validate hostId matches room host
- [ ] Call `deleteRoom()` (soft-delete with `endedAt`)
- [ ] Return `{ success: true }`

### Task 5.4: Pusher auth route

**Files:**
- Create: `src/app/api/pusher/auth/route.ts`

**Steps:**
- [ ] **POST**: Receive form-encoded `socket_id` + `channel_name`
- [ ] Validate channel name matches valid room format
- [ ] Call `pusherServer.authorizeChannel()` with unique peer user_id + user_info
- [ ] Return Pusher auth token

### Task 5.5: Pusher trigger route

**Files:**
- Create: `src/app/api/pusher/trigger/route.ts`

**Steps:**
- [ ] **POST**: Receive `{ channel, event, data, hostId }`
- [ ] Validate hostId is the room's host (fetch from DB)
- [ ] `pusherServer.trigger()` for: kick participant, lock room, end meeting broadcast
- [ ] Return `{ success: true }`

---

## Phase 6: Core WebRTC Hooks

### Task 6.1: useLocalMedia

**Files:**
- Create: `src/hooks/useLocalMedia.ts`

**Steps:**
- [ ] `getUserMedia()` with constraints: 720p video, `noiseSuppression: true, echoCancellation: true, autoGainControl: true`
- [ ] `enumerateDevices()` for device lists (audio input, video input, audio output)
- [ ] `toggleMic()` — toggle `audioTrack.enabled`
- [ ] `toggleCamera()` — toggle `videoTrack.enabled`
- [ ] `switchDevice(kind, deviceId)` — get new stream with specific device, replace tracks
- [ ] Cleanup: stop all tracks in useEffect return
- [ ] Export: `{ localStream, audioTrack, videoTrack, isMicOn, isCameraOn, toggleMic, toggleCamera, switchDevice, devices }`

### Task 6.2: usePeerMesh

**Files:**
- Create: `src/hooks/usePeerMesh.ts`

**Steps:**
- [ ] Subscribe to Pusher presence channel on mount (`buildRoomChannel(roomId)`)
- [ ] `pusher:subscription_succeeded` → iterate existing members, create `SimplePeer({ initiator: true, stream: localStream, config: { iceServers: STUN_SERVERS } })`
- [ ] `pusher:member_added` → create new peer as initiator
- [ ] `pusher:member_removed` → destroy peer, remove from state
- [ ] Listen for `PEER_OFFER` / `PEER_ANSWER` / `ICE_CANDIDATE` → `peer.signal(data)`
- [ ] On peer `'stream'` → add to `remoteStreams: Map<string, MediaStream>`
- [ ] Create DataChannel `'oprameet-data'` on each peer
- [ ] Cleanup: destroy all peers + disconnect Pusher in useEffect return
- [ ] Export: `{ peers, remoteStreams, dataChannels, sendToAll, sendToPeer, myPeerId }`

### Task 6.3: useDataChannel

**Files:**
- Create: `src/hooks/useDataChannel.ts`

**Steps:**
- [ ] Typed message protocol: `{ type: string, payload: unknown, senderId: string, timestamp: number }`
- [ ] `sendMessage(type, payload)` → broadcast to all peers' DataChannels
- [ ] `onMessage(type, callback)` → register handler by message type
- [ ] Message types: `'chat'`, `'reaction'`, `'hand-raise'`, `'hand-lower'`, `'poll-vote'`, `'whiteboard-draw'`, `'caption'`, `'state-sync'`
- [ ] Fallback: if DataChannel not available, send via Pusher client events

### Task 6.4: useAudioMeter

**Files:**
- Create: `src/hooks/useAudioMeter.ts`

**Steps:**
- [ ] Create `AudioContext` + `AnalyserNode` from audio `MediaStreamTrack`
- [ ] Compute RMS from `getByteTimeDomainData()` in `requestAnimationFrame` loop
- [ ] Active speaker threshold: volume > 0.015 for > 300ms
- [ ] Export: `{ isSpeaking, volume }` (volume: 0–1 float)
- [ ] Cleanup: close AudioContext + cancel RAF in useEffect return

---

## Phase 7: Media & Feature Hooks

### Task 7.1: useScreenShare

**Files:**
- Create: `src/hooks/useScreenShare.ts`

**Steps:**
- [ ] `startSharing()`: `getDisplayMedia({ video: true, audio: true })`
- [ ] Replace camera track in all peer senders via `sender.replaceTrack()`
- [ ] `stopSharing()`: revert to camera track in all senders
- [ ] Handle browser "Stop sharing" via `track.onended`
- [ ] Export: `{ isSharing, startSharing, stopSharing, screenStream }`

### Task 7.2: useBackground

**Files:**
- Create: `src/hooks/useBackground.ts`
- Create: `src/lib/videoBackground.ts`

**Steps:**
- [ ] Implement `ClientMediaProcessor` class using `@tensorflow-models/body-segmentation` (code in user spec)
- [ ] `startBlur(strength)` — segment + bokeh effect on canvas at 30fps
- [ ] `startVirtualBackground(imageUrl)` — segment + composite with bg image
- [ ] `stop()` — cancel RAF loop
- [ ] Hook: manage canvas ref + capture stream via `canvas.captureStream(30)`
- [ ] Replace camera track in all peers when bg changes
- [ ] Store custom bg images in `localStorage` as base64
- [ ] Export: `{ bgMode, setBgMode, setBgImage, canvasRef, processedStream }`

### Task 7.3: useBreakoutRooms

**Files:**
- Create: `src/hooks/useBreakoutRooms.ts`

**Steps:**
- [ ] State: rooms array `{ id, name, participants }`, max 20 rooms
- [ ] `createRooms(count, names?)` — generate breakout room config
- [ ] `assignParticipant(peerId, roomId)` / `autoAssign()` — round-robin assignment
- [ ] `joinRoom(roomId)` — subscribe to `presence-breakout-{roomId}-{breakoutId}` channel
- [ ] `broadcastMessage(message)` — send to all breakout channels
- [ ] `closeRooms(countdownSecs?)` — 60s countdown warning, then return all to main
- [ ] Export: `{ rooms, createRooms, assignParticipant, autoAssign, joinRoom, closeRooms, broadcastMessage, activeBreakoutId }`

### Task 7.4: usePolls

**Files:**
- Create: `src/hooks/usePolls.ts`

**Steps:**
- [ ] `createPoll({ question, options })` — broadcast via DataChannel
- [ ] `vote(pollId, optionIndex)` — deduplicate votes per peer
- [ ] Live results: vote counts per option, computed percentages
- [ ] `closePoll(pollId)` / `toggleResults(pollId)` — host-only
- [ ] `exportCsv(pollId)` — generate CSV string, trigger download
- [ ] Export: `{ polls, createPoll, vote, closePoll, toggleResults, exportCsv }`

### Task 7.5: useHandRaise

**Files:**
- Create: `src/hooks/useHandRaise.ts`

**Steps:**
- [ ] `toggleHand()` — raise/lower, broadcast via DataChannel
- [ ] Ordered queue: `raisedHands: { peerId, name, timestamp }[]` sorted by timestamp
- [ ] `lowerHand(peerId)` — host action
- [ ] Notification sound on raise: preload `Audio('/sounds/hand-raise.mp3')`
- [ ] Export: `{ raisedHands, isRaised, toggleHand, lowerHand }`

### Task 7.6: useCaptions

**Files:**
- Create: `src/hooks/useCaptions.ts`

**Steps:**
- [ ] Initialize `SpeechRecognition` / `webkitSpeechRecognition`
- [ ] `continuous = true`, `interimResults = true`
- [ ] Broadcast final transcript via DataChannel (`'caption'` type)
- [ ] Multi-language: `setLanguage(lang)` sets `recognition.lang`
- [ ] Export: `{ captions: { peerId, name, text, timestamp }[], isEnabled, toggleCaptions, setLanguage }`

### Task 7.7: useRecording

**Files:**
- Create: `src/hooks/useRecording.ts`

**Steps:**
- [ ] `MediaRecorder` with `mimeType: 'video/webm;codecs=vp9,opus'`
- [ ] Record combined canvas stream (all videos composited) or just local
- [ ] Notify all peers when recording starts/stops via DataChannel
- [ ] `stopRecording()` → create Blob → `URL.createObjectURL` → trigger download
- [ ] REC notification to all participants
- [ ] Export: `{ isRecording, startRecording, stopRecording, recordingBlob }`

### Task 7.8: useHostControls

**Files:**
- Create: `src/hooks/useHostControls.ts`

**Steps:**
- [ ] `muteParticipant(peerId)` / `muteAll()` — via DataChannel + Pusher server trigger
- [ ] `disableCamera(peerId)` — send disable command via DataChannel
- [ ] `removeParticipant(peerId)` — server-side trigger via `/api/pusher/trigger`
- [ ] `lockRoom()` / `unlockRoom()` — update room record + broadcast
- [ ] `endMeeting()` — POST `/api/room/end` + broadcast end event
- [ ] `transferHost(peerId)` / `addCoHost(peerId)` — update local state + broadcast
- [ ] Permission toggles: `preventUnmute`, `preventCamera`, `preventScreenShare`
- [ ] Export: `{ muteParticipant, muteAll, disableCamera, removeParticipant, lockRoom, unlockRoom, endMeeting, transferHost, addCoHost, permissions, setPermission }`

---

## Phase 8: UI Components — Meeting

> **Design mandate:** Every component uses the Dark Cinema design tokens. No hardcoded colors. Framer Motion for animations. Lucide icons (no emoji). Focus rings on all interactive elements.

### Task 8.1: VideoTile

**Files:**
- Create: `src/components/meeting/VideoTile.tsx`

**Design spec:**
- `<video>` element with `object-fit: cover`, `border-radius: var(--radius-lg)`
- Camera-off: dark `var(--bg-tile)` with centered avatar initial in 48px `DM Sans 600` `var(--text-secondary)`, subtle radial gradient from center
- Name pill: bottom-left, 8px horizontal padding, `var(--text-sm)`, on frosted dark pill (`rgba(0,0,0,0.6)` + `backdrop-filter: blur(8px)`)
- Mic-off icon: bottom-right, Lucide `MicOff`, 16px, `var(--danger)`, on same pill style
- Active speaker: `box-shadow: 0 0 0 2px var(--success), 0 0 20px var(--success-glow)`, pulsing animation `pulse-speaker 1.5s ease-in-out infinite`
- Hover state: `scale(1.01)`, overlay fades in with pin/mute/menu actions (Lucide icons on frosted pills)
- Local video: CSS `transform: scaleX(-1)` (mirrored)
- Pinned indicator: small 📌 pin icon top-right
- Hand raised badge: ✋ indicator top-left with amber background pill

### Task 8.2: VideoGrid

**Files:**
- Create: `src/components/meeting/VideoGrid.tsx`

**Design spec:**
- Dynamic CSS Grid with `gap: 8px`
- Layout modes (all with smooth `framer-motion layout` transitions):
  - **Auto:** Active speaker large (2/3 width), others in right strip
  - **Tiled:** Equal grid — 1=full, 2=50/50, 3-4=2×2, 5-6=2×3, 7+=paginated with page dots
  - **Spotlight:** Pinned participant fills ~85% area, others in bottom strip
  - **Sidebar:** Main view left (75%), scrollable strip right (25%)
- Screen share: takes spotlight position automatically, "You are presenting" frosted banner on presenter's view
- Grid resizing animated with `framer-motion layoutId` for smooth tile rearrangement
- Pagination: dot indicators at bottom, animated page slide

### Task 8.3: ControlBar

**Files:**
- Create: `src/components/meeting/ControlBar.tsx`

**Design spec:**
- Fixed bottom center, pill-shaped container with `var(--bg-control-bar)` + `backdrop-filter: var(--glass-blur)`
- Margin bottom: 16px, `border-radius: var(--radius-xl)`, `border: 1px solid var(--glass-border)`
- Buttons as 48×48 circles with tooltips (Radix Tooltip):
  - **Mic** (Lucide `Mic`/`MicOff`) — toggle red bg when muted
  - **Camera** (Lucide `Video`/`VideoOff`) — toggle red bg when off
  - **Screen Share** (Lucide `ScreenShare`) — toggle cyan bg when sharing
  - **Hand Raise** (Lucide `Hand`) — toggle amber bg when raised
  - **Reactions** (Lucide `Smile`) — opens emoji picker popover
  - **Activities** (Lucide `LayoutGrid`) — dropdown: Polls, Q&A, Whiteboard, Breakout
  - **Participants** (Lucide `Users`) — badge count
  - **Chat** (Lucide `MessageSquare`) — unread badge (red dot)
  - **More** (Lucide `MoreVertical`) — dropdown: Settings, Captions, Recording, Layout
  - **End call** (Lucide `Phone`) — wider (80px), `var(--danger)` bg, rotated 135°
- All buttons: `pressed: scale(0.93)` for 120ms, `hover: brightness(1.15) + scale(1.05)`
- Active speaker ambient glow: faint cyan shadow follows currently speaking participant
- Keyboard shortcut hints in tooltips: "Mute (M)", "Camera (V)", etc.

### Task 8.4: ChatSidebar

**Files:**
- Create: `src/components/meeting/ChatSidebar.tsx`

**Design spec:**
- 360px wide, slides from right with spring animation
- Header: "In-meeting messages" + close button
- Message list: scrollable, auto-scroll to bottom on new messages
- Each message: sender avatar initial (colored circle), name (`DM Sans 500`, `var(--text-primary)`), timestamp (`JetBrains Mono`, `var(--text-tertiary)`, `var(--text-xs)`), message text
- Own messages: right-aligned with `var(--accent-primary)` bubble bg
- Others' messages: left-aligned with `var(--bg-elevated)` bubble bg
- Message hover: copy icon appears (Lucide `Copy`)
- Input: bottom, frosted glass input with send button (Lucide `Send`)
- Unread badge: red dot on chat icon in ControlBar, count if > 1

### Task 8.5: ParticipantsSidebar

**Files:**
- Create: `src/components/meeting/ParticipantsSidebar.tsx`

**Design spec:**
- Same 360px slide-in pattern as ChatSidebar
- Header: "People (N)" + invite button
- Search input at top (filter participants)
- Each participant row: avatar initial, name, host/co-host badge (`var(--accent-secondary)` pill), mic icon (green/red), camera icon (green/red)
- Host sees: kebab menu per participant → Mute, Turn off camera, Remove, Make co-host
- Waiting room section (if enabled): yellow-bordered section at top, "Waiting (N)", Admit/Deny buttons per person, "Admit all" button
- Stagger animation on entries (40ms per item)

### Task 8.6: ReactionsBurst

**Files:**
- Create: `src/components/meeting/ReactionsBurst.tsx`

**Design spec:**
- Floating emoji animation on sender's video tile
- Framer Motion: emoji scales up from 0 → 1.2 → 1, then floats upward with opacity 1 → 0 over 3 seconds
- Multiple simultaneous reactions: stagger horizontal positions randomly
- Physics-based: slight random rotation, gentle horizontal drift
- Emoji picker (in ControlBar): 6 emojis in horizontal strip popover, `var(--bg-elevated)` bg

### Task 8.7: HandRaiseQueue

**Files:**
- Create: `src/components/meeting/HandRaiseQueue.tsx`

**Design spec:**
- Small floating panel, top-right of video area
- `var(--glass-bg)` background, `var(--radius-lg)`
- Ordered list: "1. Alice (2m ago)" with amber hand icon
- Host sees: "Lower" button per entry
- Animated entry: slide-in from right with stagger (40ms)
- Ambient amber glow when any hands are raised

### Task 8.8: PollsPanel

**Files:**
- Create: `src/components/meeting/PollsPanel.tsx`

**Design spec:**
- Slide-in panel (can share space with sidebar or as modal on mobile)
- Create poll form: question input + options (add/remove) + "Launch Poll" button
- Active poll view: question, options as clickable cards with radio indicator
- Results: horizontal bar chart per option, percentage label, vote count
- Bar chart colors: `var(--accent-primary)` for winner, `var(--gray-600)` for others
- Animated bars: grow from 0% width with `var(--ease-spring)`
- Close poll / Show results toggles (host)
- Export CSV button (Lucide `Download`)

### Task 8.9: QAPanel

**Files:**
- Create: `src/components/meeting/QAPanel.tsx`

**Design spec:**
- Question cards with upvote button (Lucide `ChevronUp` + count), question text, submitter name
- Sorted: most upvotes first, answered at bottom
- Answered: green checkmark badge, slightly dimmed
- Host actions: "Answer" toggle, "Dismiss" (Lucide `X`)
- Submit input: bottom of panel, "Ask a question" placeholder
- Animated resorting when upvotes change

### Task 8.10: WhiteboardPanel

**Files:**
- Create: `src/components/meeting/WhiteboardPanel.tsx`

**Design spec:**
- Full-width `<canvas>` element on white background within a dark-bordered frame
- Toolbar at top: pen (active cyan), eraser, rectangle, circle, text, color picker (6 preset colors + custom), line width slider (3 sizes)
- Undo/Redo buttons (Lucide `Undo2`/`Redo2`) — 50 steps history
- Clear board: host-only, confirmation dialog first (ui-ux-pro-max §8: `confirmation-dialogs`)
- Export as PNG: Lucide `Download`
- Broadcast draw events: `{ type, x, y, color, width, tool }` via DataChannel
- Cursor: crosshair on canvas, shows other users' cursor positions as colored dots

### Task 8.11: BreakoutRooms

**Files:**
- Create: `src/components/meeting/BreakoutRooms.tsx`

**Design spec:**
- Modal for creation: "Create breakout rooms" title, number selector (2–20), room name inputs
- Assignment view: drag-and-drop participant cards between room columns (or "Auto assign" button)
- Active breakout: room cards showing participant count, "Join" button per room
- Timer: countdown display (JetBrains Mono, large), amber pulsing when < 60s
- "Broadcast message" input: sends to all rooms
- "Close rooms" button: triggers countdown → return to main

### Task 8.12: CaptionsOverlay

**Files:**
- Create: `src/components/meeting/CaptionsOverlay.tsx`

**Design spec:**
- Lower-third overlay on video area, centered horizontally
- `var(--glass-bg)` + `backdrop-filter: blur(16px)`, `var(--radius-md)`, max-width 80%
- Text: `DM Sans 500`, `var(--text-base)`, `var(--text-primary)`
- Speaker name prefix: `var(--text-secondary)`, `var(--text-sm)`
- Fade in/out animation (200ms)
- Multiple lines: last 3 lines visible, scrolling up
- Sidebar view: full scrollable transcript

### Task 8.13: RecordingIndicator

**Files:**
- Create: `src/components/meeting/RecordingIndicator.tsx`

**Design spec:**
- Top-left corner, `var(--z-overlay)`
- Red dot (8px, `var(--danger)`) with pulsing animation + "REC" text (`JetBrains Mono 600`, `var(--text-sm)`)
- Frosted glass pill background
- Framer Motion: subtle pulsing `scale(1 → 1.05 → 1)` on the dot, 1.5s loop

### Task 8.14: WaitingRoom

**Files:**
- Create: `src/components/meeting/WaitingRoom.tsx`

**Design spec:**
- Full-screen centered layout, `var(--bg-app)` background
- OpraMeet logo at top
- Camera preview (rounded, `var(--radius-xl)`)
- "Waiting for the host to let you in" message with animated dots (`...` cycling)
- Subtle ambient background: animated gradient mesh (very subtle cyan/violet hues)
- "You were denied" state: message + "Return to home" button

### Task 8.15: SettingsModal

**Files:**
- Create: `src/components/meeting/SettingsModal.tsx`

**Design spec:**
- Radix Dialog, `var(--bg-surface)`, `var(--radius-xl)`, `var(--shadow-xl)`
- Sections: Audio, Video, General (tabs or accordion)
- Device pickers: styled `<select>` elements with Lucide icons (Mic, Video, Speaker)
- Camera preview: live `<video>` element showing selected camera
- Audio level meter: horizontal bar showing mic input level (green → amber → red)
- Spring entry animation from trigger source

### Task 8.16: BackgroundPicker

**Files:**
- Create: `src/components/meeting/BackgroundPicker.tsx`

**Design spec:**
- Grid of options: "None" (camera icon), "Blur Light" (lens icon), "Blur Heavy", 4–6 preset images, "Upload" (+ icon)
- Each option: thumbnail card (rounded, 80×60px), selected state = cyan border + checkmark
- Low-light enhancement toggle: switch component
- Presets: office, nature, abstract, gradient (store in `/public/backgrounds/`)
- Upload: file input, store as base64 in localStorage, show preview

### Task 8.17: SpeakerIndicator

**Files:**
- Create: `src/components/meeting/SpeakerIndicator.tsx`

**Design spec:**
- Wraps `VideoTile` component
- When `isSpeaking`: adds `box-shadow: 0 0 0 2px var(--success), 0 0 20px var(--success-glow)` with `pulse-speaker` animation
- CSS keyframes: `0% { box-shadow: 0 0 0 2px #10b981, 0 0 12px rgba(16,185,129,0.15); } 50% { box-shadow: 0 0 0 3px #34d399, 0 0 20px rgba(16,185,129,0.25); } 100% { same as 0% }`
- Transition respects `prefers-reduced-motion`: no animation, just static border

---

## Phase 9: Lobby + Home Components

### Task 9.1: LobbyPreview

**Files:**
- Create: `src/components/lobby/LobbyPreview.tsx`

**Design spec:**
- Full-screen centered, `var(--bg-app)`
- Camera preview: large rounded rectangle (480×360), `var(--radius-xl)`, mirror, dark border
- Below video: mic/camera toggle buttons (same style as ControlBar)
- Background picker: compact version, below toggles
- Device selectors: dropdown selects for mic, camera, speaker
- Display name input: frosted glass input, `DM Sans`, placeholder "Your name"
- "Join now" primary button: `var(--accent-primary)`, full-width below everything, `height: 48px`, `var(--radius-md)`
- Meeting info: room code (`JetBrains Mono`) + meeting name if set
- Animated entry: elements stagger in from bottom (40ms each)

### Task 9.2: PinEntry

**Files:**
- Create: `src/components/lobby/PinEntry.tsx`

**Design spec:**
- Centered card on `var(--bg-app)` background
- Lock icon (Lucide `Lock`, 48px, `var(--accent-primary)`)
- "This meeting is private" heading
- PIN input: 4–8 digit boxes (like OTP inputs), `JetBrains Mono`, large text
- Submit button: "Enter meeting"
- Error state: shake animation (framer-motion `x: [-10, 10, -10, 10, 0]`), red error message
- Lockout state: disabled input + countdown timer "Try again in 25s"
- Attempts indicator: "N attempts remaining" in `var(--text-tertiary)`

### Task 9.3: DisplayNameInput

**Files:**
- Create: `src/components/lobby/DisplayNameInput.tsx`

**Design spec:**
- Text input: `var(--bg-elevated)` bg, `var(--border-subtle)` border, focus: `var(--border-focus)` ring
- `DM Sans`, `var(--text-base)`, `var(--text-primary)`
- Persistent to `localStorage` (auto-fill on revisit)
- Validation: 2–30 chars, inline error below field

### Task 9.4: CreateMeetingCard

**Files:**
- Create: `src/components/home/CreateMeetingCard.tsx`

**Design spec:**
- Card: `var(--glass-bg)`, `var(--glass-border)`, `var(--radius-xl)`, `var(--shadow-lg)`
- "New meeting" button (Lucide `Video` + text): `var(--accent-primary)`, full-width
- Dropdown after click: "Start instant meeting" / "Create meeting for later"
- Options: Private toggle (switch), Waiting room toggle (switch)
- If private: PIN input appears (animated slide-down)
- Generated link display: `JetBrains Mono`, selectable, with copy button (Lucide `Copy`)
- Copy feedback: button text changes to "Copied!" with checkmark for 2s
- Custom meeting name input (optional, collapsible)

### Task 9.5: JoinMeetingInput

**Files:**
- Create: `src/components/home/JoinMeetingInput.tsx`

**Design spec:**
- Input: `var(--bg-elevated)`, placeholder "Enter a code or link", Lucide `Keyboard` left icon
- Join button: adjacent, `var(--accent-primary)`, disabled until valid format detected
- Auto-parse: extracts room ID from full URL or raw code
- Validation: real-time format check, green checkmark when valid
- Submit: navigates to `/{roomId}`

---

## Phase 10: Pages + Final Integration

### Task 10.1: Root layout (finalize)

**Files:**
- Modify: `src/app/layout.tsx`

**Steps:**
- [ ] Set `<html lang="en" className="dark">` with DM Sans + JetBrains Mono font variable classes
- [ ] `<Toaster>` configured with: `position: 'top-right'`, custom dark theme matching design tokens, `duration: 4000`, `aria-live: 'polite'`
- [ ] Full SEO metadata: title, description, og:title, og:description, og:image, twitter:card
- [ ] Viewport meta (never disable zoom)

### Task 10.2: Homepage

**Files:**
- Modify: `src/app/page.tsx`

**Design spec:**
- Full viewport height, `var(--bg-app)` background
- Top center: OpraMeet logo + wordmark (`DM Sans 700`, `var(--text-2xl)`, with subtle cyan glow behind)
- Tagline: "Premium video meetings. Free for everyone." (`DM Sans 400`, `var(--text-secondary)`, `var(--text-lg)`)
- Center: two cards side-by-side (responsive → stacked on mobile):
  - Left: `CreateMeetingCard`
  - Right: `JoinMeetingInput` card (same glass style)
- Background: very subtle animated gradient mesh (dark, almost imperceptible cyan/violet movement)
- Error toast: if `?error=invalid-room` in URL, show toast on mount
- Footer: minimal — "OpraMeet" + "Secure • Free • Open" in `var(--text-tertiary)`
- Entry animation: logo + tagline fade in first (300ms), then cards stagger up (40ms delay each) with spring physics

### Task 10.3: Room page (server + lobby gate)

**Files:**
- Create: `src/app/[roomId]/page.tsx`

**Steps:**
- [ ] Server component: call `fetchRoom(roomId)` via imported repository
- [ ] Room not found → render custom 404 page (centered, "Meeting not found" + link to home)
- [ ] Room ended → render "This meeting has ended" page with timestamp
- [ ] Room is private → client component wrapper that shows `PinEntry` first, then `LobbyPreview` on success
- [ ] Room has waiting room → after lobby, show `WaitingRoom` until admitted
- [ ] Normal flow → `LobbyPreview` → `MeetingRoom`
- [ ] Pass room data (isPrivate, waitingRoom, hostId) as props

### Task 10.4: MeetingRoom client component

**Files:**
- Create: `src/app/[roomId]/MeetingRoom.tsx`

**Steps:**
- [ ] `'use client'` — the main meeting controller
- [ ] Initialize all hooks in correct order:
  1. `useLocalMedia()` — camera/mic first
  2. `usePeerMesh(roomId, localStream, displayName)` — connects to peers
  3. `useDataChannel(peers)` — messaging layer
  4. `useAudioMeter(localStream)` — speaker detection
  5. `useScreenShare(peers)` — screen sharing
  6. `useBackground(localStream, peers)` — background effects
  7. `useBreakoutRooms(roomId, peers)` — breakout management
  8. `usePolls(dataChannel)` — polls
  9. `useHandRaise(dataChannel)` — hand raise queue
  10. `useCaptions()` — live captions
  11. `useRecording(localStream)` — recording
  12. `useHostControls(roomId, peers, isHost)` — host powers
- [ ] Compose UI tree:
  ```
  <div className="meeting-container">  {/* full viewport */}
    <RecordingIndicator />
    <HandRaiseQueue />
    <VideoGrid>
      {tiles.map(tile => <SpeakerIndicator><VideoTile /></SpeakerIndicator>)}
      <ReactionsBurst />
    </VideoGrid>
    <CaptionsOverlay />
    <ControlBar />
    {/* Sidebars/panels rendered conditionally */}
    <ChatSidebar />
    <ParticipantsSidebar />
    <PollsPanel />
    <QAPanel />
    <WhiteboardPanel />
    <BreakoutRooms />
    <SettingsModal />
    <BackgroundPicker />
  </div>
  ```
- [ ] Sidebar/panel state: only one open at a time (state machine)
- [ ] Network quality indicator: periodic `RTCPeerConnection.getStats()` → compute RTT/packet loss → show Good/Fair/Poor badge with colored dot
- [ ] "Reconnecting..." overlay: detected via Pusher connection state
- [ ] "You have been muted by the host" toast notification
- [ ] Keyboard shortcut listener: `useEffect` with global keydown handler
- [ ] Cleanup ALL resources on unmount (streams, peers, audio contexts, RAF loops)

---

## Verification Plan

### Per-Phase Build Check
```bash
npm run build
```
Zero errors required after each phase.

### Dev Server Check
```bash
npm run dev
```
Pages load, API routes respond, no console errors.

### UI/UX Pre-Delivery Checklist (from ui-ux-pro-max)

**Visual Quality:**
- [ ] No emoji used as icons (Lucide React SVG icons only)
- [ ] All icons from Lucide (consistent stroke width)
- [ ] Semantic color tokens used everywhere (no hardcoded hex in components)
- [ ] Glass effects render correctly
- [ ] All animations use `transform`/`opacity` only (no layout-shifting)

**Interaction:**
- [ ] All buttons have 44×44px minimum touch target
- [ ] All buttons show pressed feedback (scale 0.93–0.95)
- [ ] Disabled states: `opacity(0.4)` + `cursor: not-allowed`
- [ ] Focus rings visible on all interactive elements (2px cyan, offset 2px)
- [ ] No hover-only interactions

**Accessibility:**
- [ ] Text contrast ≥ 4.5:1 on all surfaces (AA)
- [ ] `aria-label` on every icon-only button
- [ ] `aria-live="polite"` on chat messages, captions, toasts
- [ ] Tab order matches visual order
- [ ] `prefers-reduced-motion` respected (decorative animations disabled)

**Responsive:**
- [ ] ControlBar usable on mobile (overflow menu for extra items)
- [ ] Sidebars go full-width on mobile (< 768px)
- [ ] Video grid adapts: 1 column on mobile, multi-column on desktop
- [ ] No horizontal scroll on any screen size

**Phase-Specific Checks:**
- **Phase 2**: Encrypt → decrypt round-trip returns original data
- **Phase 4**: `generateRoomId()` produces valid `abc-abcd-abc` format
- **Phase 5**: API routes return correct status codes with mock data
- **Phase 10**: Full UI renders, navigation homepage → lobby → meeting works

### Manual Verification (requires real Pusher + Google Sheets credentials)
- Create meeting → get room link → copy
- Open 2nd browser tab → join via link
- See video tiles, test all toolbar controls
- Test chat, reactions, hand raise
- Test screen sharing
- Verify dark theme renders correctly with no visual artifacts
