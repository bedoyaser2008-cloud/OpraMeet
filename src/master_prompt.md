<USER_REQUEST>
# OpraMeet â€” AI Coding Agent Master Prompt
> Paste this entire prompt into Cursor, Claude Engineer, v0, Windsurf, or any AI coding agent.

---

## ROLE & MISSION

You are an elite principal software architect specialising in WebRTC, real-time systems, and serverless cloud infrastructure. Your task is to build **OpraMeet** â€” a full-featured, production-grade Google Meet clone â€” using **Next.js 14+ (App Router), React, TypeScript, Tailwind CSS**, deployed entirely on **Vercel** with zero separate backend servers.

Read every section of this prompt completely before writing a single line of code.

---

## TECH STACK (NON-NEGOTIABLE)

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Video/Audio Signaling | Pusher Channels (Presence) |
| WebRTC Peers | `simple-peer` (client mesh) |
| Database | Google Sheets API via `googleapis` |
| Encryption | Node.js `crypto` â€” AES-256-GCM + PBKDF2 |
| Background AI | MediaPipe Selfie Segmentation (browser, WebGL) |
| Deployment | Vercel (fully serverless, no separate server) |
| Auth | Custom JWT-based session tokens (no NextAuth) |

**DO NOT use:** Socket.io, MongoDB, PostgreSQL, Redis, Firebase, Supabase, Prisma, any paid services beyond Pusher free tier, or any persistent server process.

---

## COMPLETE DIRECTORY STRUCTURE

```
opra-meet/
â”‚
â”œâ”€â”€ .env                          # All secrets and keys
â”‚
â”œâ”€â”€ database/                     # ALL Google Sheets logic lives here
â”‚   â”œâ”€â”€ connection.ts             # Google JWT auth + Sheets client init
â”‚   â”œâ”€â”€ crypto.ts                 # AES-256-GCM encrypt/decrypt engine
â”‚   â””â”€â”€ repository.ts             # CRUD: fetchRoom, saveRoom, updateRoom, deleteRoom
â”‚
â”œâ”€â”€ websocket/                    # ALL Pusher/signaling config lives here (user-customisable)
â”‚   â”œâ”€â”€ config.ts                 # Pusher server instance + channel name builder
â”‚   â”œ
<truncated 32238 bytes>
` + `database/repository.ts`
2. `websocket/config.ts` + `websocket/events.ts` + `websocket/client.ts`
3. `src/app/middleware.ts` + `src/lib/roomId.ts`
4. All API routes (`/api/room/*`, `/api/pusher/*`)
5. `src/lib/videoBackground.ts`
6. Core hooks: `useLocalMedia` â†’ `usePeerMesh` â†’ `useDataChannel` â†’ `useBackground`
7. Secondary hooks: `useScreenShare`, `useAudioMeter`, `useBreakoutRooms`, `usePolls`, `useHandRaise`, `useCaptions`, `useRecording`, `useHostControls`
8. UI components: `VideoTile` â†’ `VideoGrid` â†’ `ControlBar` â†’ sidebars â†’ modals
9. Lobby components: `LobbyPreview`, `PinEntry`, `BackgroundPicker`
10. Pages: `app/page.tsx` (home) â†’ `app/[roomId]/page.tsx` (meeting room)

---

## FINAL MANDATE

- Every component must have full TypeScript types â€” **no `any`** unless unavoidable (e.g., MediaPipe internals)
- All WebRTC resources (streams, peers, audio contexts) must be cleaned up in `useEffect` return functions
- The app must work in Chrome, Firefox, and Safari (use `adapter.js` polyfill if needed)
- All errors must be caught and shown as user-friendly toasts via `react-hot-toast`
- The Google Sheets API is called **server-side only** (inside API routes or `database/`)
- The `/websocket` folder must be **completely self-contained** â€” swapping signaling providers requires editing only this folder
- The `/database` folder must be **completely self-contained** â€” swapping the storage backend requires editing only this folder
- Do not use any component library other than shadcn/ui + Radix primitives
- All background images for virtual backgrounds must be stored in `/public/backgrounds/`
- Meeting room page must show a proper 404 if the room doesn't exist in the database
- App name is **OpraMeet** throughout (logo, tab title, og:title, etc.)

Now begin building OpraMeet from Step 1. Do not ask for clarification â€” implement everything as specified.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-02T19:32:34+05:30.
</ADDITIONAL_METADATA>
