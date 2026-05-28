import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { rooms, messages } from "../routes/rooms.js";
import { logger } from "../config/logger.js";

interface AuthedSocket extends Socket {
  data: { userId: string; email: string; roomId?: string };
}

// Per-room exclusive locks for screen share & whiteboard.
const screenLock = new Map<string, string>();      // roomId -> userId
const whiteboardLock = new Map<string, string>();  // roomId -> userId
const strokeHistory = new Map<string, unknown[]>();

export function registerSignaling(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("missing_token"));
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; email: string };
      (socket as AuthedSocket).data.userId = payload.sub;
      (socket as AuthedSocket).data.email = payload.email;
      next();
    } catch {
      next(new Error("invalid_token"));
    }
  });

  io.on("connection", (socket) => {
    const s = socket as AuthedSocket;

    s.on("room:join", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId);
      if (!room || room.ended) return s.emit("room:error", { code: "room_unavailable" });
      s.data.roomId = roomId;
      s.join(roomId);
      io.to(roomId).emit("participant:joined", { userId: s.data.userId });
    });

    // --- Chat ---
    s.on("chat:send", ({ text, userName }: { text: string; userName?: string }) => {
      const roomId = s.data.roomId;
      if (!roomId || !text?.trim()) return;
      const msg = {
        id: crypto.randomUUID(),
        userId: s.data.userId,
        userName: userName || s.data.email,
        text: text.slice(0, 2000),
        at: Date.now(),
      };
      const hist = messages.get(roomId) ?? [];
      hist.push(msg);
      messages.set(roomId, hist);
      io.to(roomId).emit("chat:new", msg);
    });

    // --- WebRTC signaling (mesh) ---
    s.on("webrtc:signal", ({ to, signal }: { to: string; signal: unknown }) => {
      io.to(to).emit("webrtc:signal", { from: s.id, signal });
    });

    // --- Exclusive screen share ---
    s.on("screen:request", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      const holder = screenLock.get(roomId);
      if (holder && holder !== s.data.userId) {
        return s.emit("screen:denied", { holder });
      }
      screenLock.set(roomId, s.data.userId);
      io.to(roomId).emit("screen:started", { userId: s.data.userId });
    });
    s.on("screen:stop", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      if (screenLock.get(roomId) === s.data.userId) {
        screenLock.delete(roomId);
        io.to(roomId).emit("screen:stopped", { userId: s.data.userId });
      }
    });

    // --- Whiteboard ---
    s.on("wb:request", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      const holder = whiteboardLock.get(roomId);
      if (holder && holder !== s.data.userId) {
        return s.emit("wb:denied", { holder });
      }
      whiteboardLock.set(roomId, s.data.userId);
      io.to(roomId).emit("wb:started", { userId: s.data.userId });
    });
    s.on("wb:stop", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      if (whiteboardLock.get(roomId) === s.data.userId) {
        whiteboardLock.delete(roomId);
        io.to(roomId).emit("wb:stopped", { userId: s.data.userId });
      }
    });
    s.on("wb:event", (evt: { type: string; payload: unknown }) => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      const hist = strokeHistory.get(roomId) ?? [];
      hist.push(evt);
      strokeHistory.set(roomId, hist);
      s.to(roomId).emit("wb:event", evt);
    });
    s.on("wb:sync-request", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      s.emit("wb:sync-response", { history: strokeHistory.get(roomId) ?? [] });
    });
    s.on("wb:clear", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      strokeHistory.set(roomId, []);
      io.to(roomId).emit("wb:clear");
    });

    s.on("disconnect", () => {
      const roomId = s.data.roomId;
      if (!roomId) return;
      if (screenLock.get(roomId) === s.data.userId) screenLock.delete(roomId);
      if (whiteboardLock.get(roomId) === s.data.userId) whiteboardLock.delete(roomId);
      io.to(roomId).emit("participant:left", { userId: s.data.userId });
      logger.debug({ userId: s.data.userId, roomId }, "socket_disconnect");
    });
  });
}
