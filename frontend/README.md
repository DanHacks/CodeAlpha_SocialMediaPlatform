# SafeGuardMeet

> **Secure-by-default video meetings, encrypted chat, file sharing & live whiteboard collaboration.**

SafeGuardMeet is a real-time communication platform for distributed teams who want fewer tabs and more flow. Encrypted HD video, persistent rooms, multi-user whiteboard, file sharing and reactions — in one beautifully secure workspace.

Built by **Hydan Koech**.

---

## ✨ Features

### 🎥 Meetings
- HD video grid with adaptive layouts (1 → 6+ tiles)
- Mic / camera / screen-share toggles with visual states
- Raise hand (animated badge), emoji reactions (floating)
- Recording indicator, copy-link, leave call
- Picture-in-picture style thumbnail strip when whiteboard or screen-share is active

### 🛡 Room Creation, Profile Photo & Privileges
When a user clicks **"New room with link"** they get a full creation wizard:
- **Room profile photo** — upload a custom image (≤ 4 MB, stored as a data URL on the room metadata) or pick from one of four curated presets. The photo is shown in the meeting top bar and on shared previews.
- **Room name** — labels the meeting in the header and shareable link card.
- **Participant privileges** (toggleable at create time, editable any time by the host):
  - Allow chat
  - Allow reactions
  - Allow participants to share screen
  - Allow participants to use whiteboard
  - Mute participants on entry
- A **shareable link** is generated and can be copied directly from the dialog.

Room metadata is persisted in `localStorage` under `safeguardmeet.rooms.v1` via a small pub-sub `roomStore` (`src/lib/roomStore.ts`) so other tabs/participants in the same browser see live updates (privileges, sharer locks, recording state, ended state).

### 👑 Host Controls & Privileges
The user who creates a room becomes the **host**. The host sees a **Settings** button in the meeting top bar and a **Crown badge** next to the room name. From the Settings dialog the host can:
- Toggle every participant privilege live (changes propagate via `roomStore`).
- **Designate a recorder** — pick any participant from a dropdown. Only the host or the designated recorder can press the Record button; everyone else gets a toast explaining recording is locked.
- Privileges are enforced on the participant side too — for example, if a guest tries to share their screen while it's disabled, they're blocked with a clear toast.

### 🚪 Host Ends the Meeting (Google-Meet-style)
- **When the host clicks Leave/End** they get a confirmation dialog warning that ending will disconnect everyone. On confirm, `roomStore.end(roomId)` flips the room's `ended` flag.
- All other participants subscribed to the store immediately see an **"The host ended this meeting"** alert dialog and are routed back to the dashboard.
- **Non-host participants** leaving simply disconnect themselves — the meeting continues for everyone else, and any sharing locks they held (screen / whiteboard) are released automatically so the next person can take over.

### 🔒 Exclusive Screen Share & Whiteboard
Only **one person at a time** can share their screen, and only one can present the whiteboard:
- The active sharer is tracked on the room metadata (`activeScreenSharer`, `activeWhiteboardSharer`).
- If a second user tries to start sharing, an **AlertDialog** pops up: *"X is currently sharing the screen. Please wait or ask them to end theirs."* with two actions: **Wait** or **Ask them to stop** (sends a polite notification toast).
- When the active sharer toggles off, leaves, or hands over, the lock is released and the next person can claim it.
- Starting one share automatically ends the other for that user (you can't simultaneously screen-share *and* present the whiteboard yourself).

### 🖼 Big-Stage Collaborative Whiteboard
- The **Whiteboard now opens as the main stage** (just like screen sharing). Participants collapse into a thumbnail strip, giving the canvas the full space it deserves.
- Real-time multi-user drawing across tabs/windows using the browser **`BroadcastChannel` API** (channel: `sgm-whiteboard-${roomId}`).
- Tools: **Pencil**, **Eraser**, **Rectangle**, **Circle**, **Line**, color picker (6 colors), brush-size slider (1–20).
- **Live remote cursors** with name labels & per-peer color.
- **Late-joiner sync** via `sync-request` / `sync-response` handshake — new joiners get the full stroke history.
- **Normalized coordinates (0–1)** so strokes stay aligned across screen sizes & DPRs.
- Incremental segment drawing for sub-frame latency.
- Simulated "ghost" peers move and draw to demo collaboration in a single browser.
- One-click **Clear** broadcast to all peers.

### 💬 Chat
- Threaded messages with timestamps
- Ambient simulated peer replies for demo realism

### 📎 Files
- Mock upload, list, and download UI
- File-type aware iconography

### 👥 Participants Panel
- Real-time mic / camera / hand-raised state per peer
- Host badge, "you" highlight

### 🔐 Auth & Routing
- Mock JWT-style auth via `localStorage` (`safeguardmeet.auth.user`)
- Protected routes for `/dashboard` and `/room/:roomId`
- Login, Register, Landing, Dashboard, Meeting Room, NotFound

### 🏠 Marketing Landing Page
- Hero with floating animated 3D logo & live stat cards
- Trust strip (AES-256, SOC 2, GDPR, latency)
- Feature grid, security spotlight, how-it-works, testimonials, pricing (3 tiers), final CTA
- Fully responsive

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `hsl(22 96% 54%)` (Orange) |
| Secondary | `hsl(222 65% 18%)` (Navy) |
| Brand gradient | Orange → Glow Orange |
| Display font | Space Grotesk |
| Body font | Inter |
| Logo | Custom 3D shield + play emblem (`src/assets/safeguardmeet-logo.png`) — used as both brand mark and `favicon.png` |

All colors are HSL semantic tokens defined in `src/index.css` and consumed via Tailwind. **No hard-coded colors in components.**

---

## 🏗 Tech Stack

- **React 18 + Vite 5 + TypeScript 5**
- **Tailwind CSS v3** + shadcn/ui
- **react-router-dom v6** for routing
- **lucide-react** icons
- **sonner** toasts
- **BroadcastChannel API** for real-time whiteboard sync (frontend-only)
- **HTML5 Canvas** for whiteboard rendering

---

## 📁 Project Structure

```
src/
├─ assets/
│  └─ safeguardmeet-logo.png   ← 3D shield logo (also favicon)
├─ components/
│  ├─ Logo.tsx                 ← Animated brand mark
│  ├─ ProtectedRoute.tsx
│  └─ meeting/
│     ├─ VideoGrid.tsx         ← Adaptive grid + screen-share layout
│     ├─ Whiteboard.tsx        ← Real-time canvas + BroadcastChannel sync
│     ├─ ChatPanel.tsx
│     ├─ FilesPanel.tsx
│     └─ ParticipantsPanel.tsx
├─ contexts/
│  └─ AuthContext.tsx          ← Mock auth (localStorage)
├─ lib/
│  └─ mockData.ts              ← Users, participants, rooms
├─ pages/
│  ├─ Index.tsx                ← Marketing landing
│  ├─ Auth.tsx                 ← Login + Register
│  ├─ Dashboard.tsx            ← Start / join / schedule
│  ├─ MeetingRoom.tsx          ← Stage + side panels + controls
│  └─ NotFound.tsx
└─ index.css                   ← Design tokens
```

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:8080 (or the port Vite prints).

### Demo credentials
- Email: `admin@safeguardmeet.app`
- Password: `demo1234`

(Or click **Sign in** — fields are pre-filled.)

---

## 🧪 Trying the real-time whiteboard

1. Sign in and click **Start instant meeting** (or open any `/room/:roomId`).
2. Click the **Whiteboard** button in the bottom controls — it takes over the main stage; participant tiles shrink into a strip below.
3. Open the **same room URL** in a second browser tab/window.
4. Draw in either tab — strokes, shapes, cursors and clears appear in the other instantly.
5. Two simulated "ghost" peers also move and draw automatically to demonstrate multi-user feel.

> **Note:** `BroadcastChannel` works between same-origin tabs on one machine. To go cross-device, swap the channel for a Socket.io / WebSocket transport — the wire-format event schema (`begin`, `extend`, `shape`, `end`, `clear`, `cursor`, `sync-request`, `sync-response`) is already production-shaped.

---

## 🛣 Backend Roadmap (next steps)

This MVP is **frontend-only with mock data**. To productionize:

1. **Auth** → Lovable Cloud (or Supabase): replace `AuthContext` localStorage with real JWT sessions.
2. **Signaling** → Socket.io / WebSocket server emitting the same whiteboard event schema; swap `BroadcastChannel` for socket emit/subscribe.
3. **Media** → WebRTC mesh (≤6) or SFU (mediasoup / LiveKit) for >6 participants. Replace stock images in `VideoGrid` with `<video srcObject={stream} />`.
4. **Files** → Object storage (S3 / Lovable Cloud Storage) with signed URLs.
5. **Chat** → Persist messages in Postgres; subscribe via WebSocket.
6. **Recording** → Server-side mixer or per-track recording to object storage.

---

## 📜 License

© 2026 SafeGuardMeet by Hydan Koech. All rights reserved.
