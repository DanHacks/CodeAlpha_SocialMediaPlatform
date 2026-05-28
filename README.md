# SafeGuardMeet

> **Secure-by-default video meetings, encrypted chat, file sharing & live whiteboard collaboration.**

SafeGuardMeet is a real-time communication platform for distributed teams who want fewer tabs and more flow. Encrypted HD video, persistent rooms, multi-user whiteboard, file sharing and reactions — in one beautifully secure workspace.

**Author:** Hydan Koech · **License:** MIT
**Backend contributions are welcome and accepted** — see [`backend/`](./backend/README.md) and open a PR.

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

## 🔐 Secure Backend (Node.js + TypeScript)

A production-shaped reference backend lives in [`backend/`](./backend) — built with **Node 20+ / TypeScript / Express / Socket.io / Zod / JWT / bcrypt / Helmet / pino**.

### Run it

```bash
cd backend
cp .env.example .env
# generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
npm install
npm run dev          # http://localhost:4000
```

### Security defaults

- TLS-terminated behind a proxy · `helmet()` security headers · strict CORS allow-list
- JWT **access (15 m)** + **refresh (7 d)** with separate secrets · bcrypt cost 12
- `zod` validation on every body · `express-rate-limit` (120 req/min/IP)
- `pino` structured logs with secret redaction · centralized error handler (no stack leaks)
- Socket.io handshake auth via JWT · host-only room mutations · per-room exclusive locks for screen-share & whiteboard

### HTTP API (base `http://localhost:4000/api`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | – | Create account |
| POST | `/auth/login` | – | Returns `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | – | New access token from refresh token |
| POST | `/rooms` | ✅ | Create room (you become host & default recorder) |
| GET | `/rooms/:id` | ✅ | Fetch room metadata |
| PATCH | `/rooms/:id` | ✅ host | Update name / photo / `recorderId` / `settings` |
| POST | `/rooms/:id/end` | ✅ host | End meeting for everyone |
| POST | `/files/sign-upload` | ✅ | S3-style signed upload URL |

```bash
TOKEN=$(curl -s localhost:4000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.com","password":"demo1234"}' | jq -r .accessToken)

curl localhost:4000/api/rooms \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Standup"}'
```

### Realtime (Socket.io)

Pass the access token via `auth.token` on connect. Events mirror the frontend's `BroadcastChannel` schema so the swap is mechanical:

`room:join` · `chat:send` / `chat:new` · `webrtc:signal` · `screen:request|stop|started|stopped|denied` · `wb:request|stop|started|stopped|denied|event|sync-request|sync-response|clear` · `participant:joined|left`

### Wiring the React frontend (already done ✅)

The frontend ships **fully wired** to this backend. Behaviour is controlled by a single environment variable:

```bash
# .env (frontend)
VITE_API_URL=http://localhost:4000
```

- **Unset** → the app runs in **local preview mode** (mocked auth, `localStorage`-backed rooms, simulated chat).
  Useful for design previews and demos without a running backend.
- **Set** → all auth, rooms CRUD, and realtime chat go through the Node/TS backend.

Implementation map (already in the repo):

| Concern | Frontend module | Backend endpoint / event |
|---|---|---|
| Login / register / refresh | `src/contexts/AuthContext.tsx` + `src/lib/api.ts` | `POST /api/auth/{login,register,refresh}` |
| List my rooms + delete | `src/pages/Dashboard.tsx` → `api.listRooms()` / `api.deleteRoom()` | `GET /api/rooms`, `DELETE /api/rooms/:id` |
| Create room (with privileges + cover photo) | `Dashboard.tsx` → `api.createRoom()` | `POST /api/rooms` |
| Load room on join | `MeetingRoom.tsx` → `api.getRoom()` + socket `room:join` | `GET /api/rooms/:id` |
| Update settings / recorder | `MeetingRoom.tsx` → `api.updateRoom()` | `PATCH /api/rooms/:id` |
| Host ends meeting on leave | `MeetingRoom.tsx` → `api.endRoom()` | `POST /api/rooms/:id/end` |
| Chat (history + live) | `src/components/meeting/ChatPanel.tsx` + `src/lib/socket.ts` | `GET /api/rooms/:id/messages`, socket `chat:send` / `chat:new` |
| Exclusive screen / whiteboard locks | `MeetingRoom.tsx` socket listeners | `screen:*`, `wb:*` events |
| File uploads | `FilesPanel.tsx` (signed-URL stub) | `POST /api/files/sign-upload` |

Tokens are persisted in `localStorage` under `safeguardmeet.tokens` and auto-refreshed on `401`.
Socket.io is opened lazily in `src/lib/socket.ts` only when both `VITE_API_URL` and an access token are present.

### Production roadmap

1. **Postgres** with `pg` + migrations (`users`, `rooms`, `room_members`, `messages`, `files`).
2. **Refresh-token rotation** (hashed, single-use, revocable on logout).
3. **WebRTC at scale** — mesh ≤6, then SFU (LiveKit / mediasoup) + coturn TURN servers.
4. **Recording** via LiveKit Egress / mediasoup-recorder → S3.
5. **Object storage** — wire `@aws-sdk/s3-request-presigner` in `routes/files.ts`.
6. **Observability** — pino → Loki/Datadog; `/metrics` via `prom-client`.
7. **Hardening** — CSRF (if cookie auth), audit logs, per-user rate limits, `npm audit` + Snyk.
8. **Deploy** — Dockerfile + compose (api + postgres + redis + coturn) → Fly.io / Render / AWS ECS.

---

## 🤝 Contributing

**Backend contributions are welcome and accepted.** Fork → `feat/<short-name>` branch → PR.
Run `npm run lint && npm test` in `backend/` before pushing. Keep handlers thin; validate every input with `zod`.

---

## 📜 License & Author

MIT © 2026 **Hydan Koech** — SafeGuardMeet.
