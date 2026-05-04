// Lightweight in-memory + localStorage room store (frontend mock).
// Persists meeting metadata, host privileges, recorder assignment, and ended state.

export interface RoomSettings {
  allowChat: boolean;
  allowReactions: boolean;
  allowParticipantScreenShare: boolean;
  allowParticipantWhiteboard: boolean;
  muteOnEntry: boolean;
}

export interface ActiveSharer {
  id: string;
  name: string;
}

export interface RoomMeta {
  roomId: string;
  name: string;
  photo: string; // data URL or remote
  hostId: string;
  hostName: string;
  recorderId: string | null; // user id allowed to record
  settings: RoomSettings;
  ended: boolean;
  createdAt: number;
  activeScreenSharer: ActiveSharer | null;
  activeWhiteboardSharer: ActiveSharer | null;
  isRecording: boolean;
}

const KEY = "safeguardmeet.rooms.v1";

type Listener = (rooms: Record<string, RoomMeta>) => void;
const listeners = new Set<Listener>();

function load(): Record<string, RoomMeta> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return {};
}
function save(map: Record<string, RoomMeta>) {
  localStorage.setItem(KEY, JSON.stringify(map));
  listeners.forEach((l) => l(map));
}

export const defaultSettings: RoomSettings = {
  allowChat: true,
  allowReactions: true,
  allowParticipantScreenShare: true,
  allowParticipantWhiteboard: true,
  muteOnEntry: false,
};

export const defaultRoomPhotos = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop",
];

export const roomStore = {
  get(roomId: string): RoomMeta | undefined {
    return load()[roomId];
  },
  upsert(meta: RoomMeta) {
    const map = load();
    map[meta.roomId] = meta;
    save(map);
  },
  patch(roomId: string, patch: Partial<RoomMeta>) {
    const map = load();
    if (!map[roomId]) return;
    map[roomId] = { ...map[roomId], ...patch, settings: { ...map[roomId].settings, ...(patch.settings || {}) } };
    save(map);
  },
  end(roomId: string) {
    const map = load();
    if (!map[roomId]) {
      map[roomId] = makeDefault(roomId, "guest", "Guest");
    }
    map[roomId].ended = true;
    save(map);
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function makeDefault(roomId: string, hostId: string, hostName: string, name?: string, photo?: string): RoomMeta {
  return {
    roomId,
    name: name || "Untitled meeting",
    photo: photo || defaultRoomPhotos[Math.floor(Math.random() * defaultRoomPhotos.length)],
    hostId,
    hostName,
    recorderId: hostId,
    settings: { ...defaultSettings },
    ended: false,
    createdAt: Date.now(),
    activeScreenSharer: null,
    activeWhiteboardSharer: null,
    isRecording: false,
  };
}
