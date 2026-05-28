// REST client for the SafeGuardMeet backend.
// Reads VITE_API_URL from env. If unset, `isApiEnabled()` returns false and
// the app falls back to localStorage-only behaviour (useful for previews).

import type { RoomMeta, RoomSettings } from "./roomStore";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TOKENS_KEY = "safeguardmeet.tokens";

export interface Tokens { accessToken: string; refreshToken: string }
export interface ApiUser { id: string; email: string; name: string }
export interface ApiRoom {
  id: string;
  name: string;
  photo: string;
  hostId: string;
  hostName: string;
  recorderId: string | null;
  settings: RoomSettings;
  ended: boolean;
  createdAt: number;
}
export interface ApiMessage { id: string; userId: string; userName: string; text: string; at: number }

export function isApiEnabled() { return !!BASE; }
export function getTokens(): Tokens | null {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || "null"); } catch { return null; }
}
export function setTokens(t: Tokens | null) {
  if (t) localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
  else localStorage.removeItem(TOKENS_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!BASE) throw new Error("api_disabled");
  const tokens = getTokens();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (tokens?.accessToken) headers.set("Authorization", `Bearer ${tokens.accessToken}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401 && retry && tokens?.refreshToken) {
    // try refresh once
    const r = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (r.ok) {
      const { accessToken } = await r.json();
      setTokens({ ...tokens, accessToken });
      return request<T>(path, init, false);
    }
    setTokens(null);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body || res.statusText}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  // auth
  register: (email: string, password: string, name?: string) =>
    request<{ id: string; email: string }>("/api/auth/register", {
      method: "POST", body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ user: ApiUser; accessToken: string; refreshToken: string }>("/api/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),

  // rooms CRUD
  listRooms: () => request<{ rooms: ApiRoom[] }>("/api/rooms"),
  getRoom: (id: string) => request<ApiRoom>(`/api/rooms/${id}`),
  createRoom: (payload: { name: string; photo?: string; settings?: Partial<RoomSettings> }) =>
    request<ApiRoom>("/api/rooms", { method: "POST", body: JSON.stringify(payload) }),
  updateRoom: (id: string, patch: Partial<Pick<ApiRoom, "name" | "photo" | "recorderId"> & { settings: Partial<RoomSettings> }>) =>
    request<ApiRoom>(`/api/rooms/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteRoom: (id: string) =>
    request<{ ok: true }>(`/api/rooms/${id}`, { method: "DELETE" }),
  endRoom: (id: string) =>
    request<{ ok: true }>(`/api/rooms/${id}/end`, { method: "POST" }),

  // chat
  listMessages: (id: string) => request<{ messages: ApiMessage[] }>(`/api/rooms/${id}/messages`),
};

// Helpers to bridge ApiRoom <-> RoomMeta
export function apiRoomToMeta(r: ApiRoom): RoomMeta {
  return {
    roomId: r.id,
    name: r.name,
    photo: r.photo,
    hostId: r.hostId,
    hostName: r.hostName,
    recorderId: r.recorderId,
    settings: r.settings,
    ended: r.ended,
    createdAt: r.createdAt,
    activeScreenSharer: null,
    activeWhiteboardSharer: null,
    isRecording: false,
  };
}
