# SafeGuardMeet Backend (Node.js + TypeScript)

Secure backend reference implementation for **SafeGuardMeet** — built with **Node.js 20+**, **TypeScript 5**, **Express 4**, **Socket.io 4**, **Zod**, **JWT**, **bcrypt**, **Helmet** and **pino**.

> **Author:** Hydan Koech · **License:** MIT
> Contributions to the backend are **welcome and accepted** — open a PR or an issue.

---

## 1. Quick start

```bash
cd backend
cp .env.example .env
# generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

npm install
npm run dev          # http://localhost:4000
```

Health check: `GET http://localhost:4000/health` → `{ "ok": true }`.

## 2. Project layout

```
backend/
├─ src/
│  ├─ server.ts                 # Express + Socket.io bootstrap
│  ├─ config/{env,logger}.ts    # zod-validated env + pino logger
│  ├─ middleware/{auth,error}.ts
│  ├─ services/tokens.ts        # JWT access / refresh
│  ├─ routes/
│  │  ├─ auth.ts                # register, login, refresh
│  │  ├─ rooms.ts               # create, get, patch, end
│  │  └─ files.ts               # signed-URL upload stub
│  └─ signaling/index.ts        # Socket.io: chat, WebRTC, whiteboard, locks
├─ .env.example
├─ tsconfig.json
└─ package.json
```

## 3. Security defaults

| Concern | Mechanism |
|---|---|
| Transport | Behind TLS (terminate at NGINX / Cloud LB) |
| Headers | `helmet()` (CSP, HSTS, X-Frame-Options, …) |
| CORS | Strict `CORS_ORIGIN` allow-list |
| Body limits | `express.json({ limit: "1mb" })` |
| Rate limit | `express-rate-limit` (120 req/min/IP) |
| Auth | JWT access (15 min) + refresh (7 d), HS256, separate secrets |
| Passwords | `bcrypt` cost 12 |
| Validation | `zod` on every request body |
| Logging | `pino` with secret redaction |
| Socket auth | JWT verified in `io.use()` handshake |
| Authorization | Host-only mutations on rooms; per-room exclusive locks for screen & whiteboard |
| Errors | Centralized `errorHandler`, never leaks stack traces |

## 4. HTTP API

Base URL: `http://localhost:4000/api`. All authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, name? }` | `201 { id, email }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |

### Rooms (auth required)

| Method | Path | Notes |
|---|---|---|
| POST | `/rooms` | Body: `{ name, photo?, settings? }`. Creator becomes host & default recorder. |
| GET | `/rooms/:id` | Returns room metadata. |
| PATCH | `/rooms/:id` | Host-only. Update `name`, `photo`, `recorderId`, `settings`. |
| POST | `/rooms/:id/end` | Host-only. Marks `ended=true` → clients disconnect. |

### Files (auth required)

| Method | Path | Notes |
|---|---|---|
| POST | `/files/sign-upload` | Returns S3-style signed upload URL (stub — wire `@aws-sdk/s3-request-presigner`). |

### cURL example

```bash
TOKEN=$(curl -s localhost:4000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.com","password":"demo1234"}' | jq -r .accessToken)

curl localhost:4000/api/rooms \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Standup"}'
```

## 5. Realtime (Socket.io)

Connect with the access token in `auth.token`. Channels are scoped to a `roomId`.

```ts
import { io } from "socket.io-client";
const socket = io("http://localhost:4000", { auth: { token: accessToken } });
socket.emit("room:join", { roomId });
```

| Event (client → server) | Payload | Description |
|---|---|---|
| `room:join` | `{ roomId }` | Join room namespace |
| `chat:send` | `{ text }` | Broadcast chat message |
| `webrtc:signal` | `{ to, signal }` | Mesh-mode SDP/ICE relay |
| `screen:request` / `screen:stop` | — | Acquire/release exclusive screen lock |
| `wb:request` / `wb:stop` | — | Acquire/release whiteboard lock |
| `wb:event` | `{ type, payload }` | `begin`, `extend`, `shape`, `end`, `cursor` |
| `wb:sync-request` | — | Late-joiner: request full history |
| `wb:clear` | — | Wipe whiteboard for all peers |

| Event (server → client) | Description |
|---|---|
| `chat:new`, `participant:joined`, `participant:left` | Room events |
| `screen:started` / `screen:stopped`, `screen:denied` | Screen-share lock state |
| `wb:started` / `wb:stopped`, `wb:denied`, `wb:event`, `wb:sync-response`, `wb:clear` | Whiteboard state |
| `room:error` | `{ code }` |

## 6. Wiring the React frontend

Create `src/lib/api.ts` in the React app:

```ts
const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("sgm.accessToken");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json() as Promise<T>;
}
```

Replace mock auth in `AuthContext`:

```ts
const { user, accessToken, refreshToken } = await api("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});
localStorage.setItem("sgm.accessToken", accessToken);
localStorage.setItem("sgm.refreshToken", refreshToken);
```

Replace `BroadcastChannel` in `Whiteboard.tsx` with Socket.io — the event names already match (`wb:event`, `wb:sync-request`, `wb:clear`).

Set `VITE_API_URL=http://localhost:4000` in the frontend `.env`.

## 7. Production roadmap

1. **Postgres** — swap the in-memory `Map` stores for `pg` + migrations (Prisma or Kysely). Tables: `users`, `rooms`, `room_members`, `messages`, `files`.
2. **Refresh-token rotation** — persist hashed refresh tokens, rotate on each use, revoke on logout.
3. **WebRTC at scale** — mesh ≤6 peers, then route through an **SFU** (LiveKit, mediasoup) and serve TURN via coturn.
4. **Recording** — server-side compositor (LiveKit Egress / mediasoup-recorder) → S3.
5. **Object storage** — wire `@aws-sdk/s3-request-presigner` in `files.ts`.
6. **Observability** — pino → Loki/Datadog; `/metrics` via `prom-client`.
7. **Hardening** — CSRF on cookie auth, audit logs, per-user rate limits, dependency scanning (npm audit, Snyk).
8. **Deployment** — Dockerfile + docker-compose (api + postgres + redis + coturn), then Fly.io / Render / AWS ECS.

## 8. Contributing

Backend contributions are **welcome and encouraged**.

- Fork → branch (`feat/<short-name>`) → PR
- Run `npm run lint && npm test` before pushing
- Keep handlers thin; put logic in `services/`
- Validate every input with `zod`

— Hydan Koech
