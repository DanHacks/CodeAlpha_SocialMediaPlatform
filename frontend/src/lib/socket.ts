// Socket.io client factory. Connects only if VITE_API_URL is configured and
// an access token is available; otherwise returns null so the app continues
// to run on the local mock pipeline.

import { io, type Socket } from "socket.io-client";
import { getTokens } from "./api";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

let cached: Socket | null = null;

export function getSocket(): Socket | null {
  if (!BASE) return null;
  const tokens = getTokens();
  if (!tokens?.accessToken) return null;
  if (cached && cached.connected) return cached;
  cached = io(BASE, {
    auth: { token: tokens.accessToken },
    transports: ["websocket"],
    autoConnect: true,
  });
  return cached;
}

export function disconnectSocket() {
  cached?.disconnect();
  cached = null;
}
