import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

export const roomsRouter = Router();
roomsRouter.use(requireAuth);

export interface RoomSettings {
  allowChat: boolean;
  allowReactions: boolean;
  allowParticipantScreenShare: boolean;
  allowParticipantWhiteboard: boolean;
  muteOnEntry: boolean;
}
export interface Room {
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

export const rooms = new Map<string, Room>();
// Per-room chat history (in-memory; swap for Postgres in prod)
export const messages = new Map<string, Array<{ id: string; userId: string; userName: string; text: string; at: number }>>();

const defaults: RoomSettings = {
  allowChat: true,
  allowReactions: true,
  allowParticipantScreenShare: true,
  allowParticipantWhiteboard: true,
  muteOnEntry: false,
};

// CREATE
roomsRouter.post("/", (req, res) => {
  const body = z.object({
    name: z.string().min(1).max(120),
    photo: z.string().max(2_000_000).optional(),
    settings: z.object({
      allowChat: z.boolean(),
      allowReactions: z.boolean(),
      allowParticipantScreenShare: z.boolean(),
      allowParticipantWhiteboard: z.boolean(),
      muteOnEntry: z.boolean(),
    }).partial().optional(),
  }).parse(req.body);

  const id = `sgm-${crypto.randomUUID().slice(0, 8)}`;
  const room: Room = {
    id,
    name: body.name,
    photo: body.photo ?? "",
    hostId: req.user!.sub,
    hostName: req.user!.email.split("@")[0],
    recorderId: req.user!.sub,
    settings: { ...defaults, ...body.settings },
    ended: false,
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  res.status(201).json(room);
});

// LIST mine (hosted)
roomsRouter.get("/", (req, res) => {
  const mine = [...rooms.values()]
    .filter((r) => r.hostId === req.user!.sub)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ rooms: mine });
});

// READ
roomsRouter.get("/:id", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) throw new HttpError(404, "room_not_found");
  res.json(room);
});

// UPDATE
roomsRouter.patch("/:id", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) throw new HttpError(404, "room_not_found");
  if (room.hostId !== req.user!.sub) throw new HttpError(403, "host_only");

  const body = z.object({
    name: z.string().min(1).max(120).optional(),
    photo: z.string().optional(),
    recorderId: z.string().nullable().optional(),
    settings: z.record(z.boolean()).optional(),
  }).parse(req.body);

  Object.assign(room, body, {
    settings: { ...room.settings, ...(body.settings ?? {}) },
  });
  res.json(room);
});

// DELETE
roomsRouter.delete("/:id", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) throw new HttpError(404, "room_not_found");
  if (room.hostId !== req.user!.sub) throw new HttpError(403, "host_only");
  rooms.delete(req.params.id);
  messages.delete(req.params.id);
  res.json({ ok: true });
});

// END for everyone (host-only)
roomsRouter.post("/:id/end", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) throw new HttpError(404, "room_not_found");
  if (room.hostId !== req.user!.sub) throw new HttpError(403, "host_only");
  room.ended = true;
  res.json({ ok: true });
});

// Chat history
roomsRouter.get("/:id/messages", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) throw new HttpError(404, "room_not_found");
  res.json({ messages: messages.get(req.params.id) ?? [] });
});
