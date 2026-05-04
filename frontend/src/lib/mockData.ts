export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Participant extends User {
  audioOn: boolean;
  videoOn: boolean;
  isHost?: boolean;
  isScreenSharing?: boolean;
  isYou?: boolean;
  handRaised?: boolean;
  reaction?: string | null;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export interface SharedFile {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  type: string;
}

export interface Room {
  id: string;
  roomId: string;
  name: string;
  createdBy: string;
  participantsCount: number;
  scheduledFor?: string;
  thumbnail: string;
}

export const currentUser: User = {
  id: "u-you",
  name: "Hydan Koech",
  email: "admin@safeguardmeet.app",
  avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=faces",
};

export const mockParticipants: Participant[] = [
  {
    id: "u-you",
    name: "Hydan Koech (You)",
    email: "admin@safeguardmeet.app",
    avatar: currentUser.avatar,
    audioOn: true,
    videoOn: true,
    isHost: true,
    isYou: true,
  },
  {
    id: "u-2",
    name: "Sarah Chen",
    email: "sarah@safeguardmeet.app",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
    audioOn: true,
    videoOn: true,
  },
  {
    id: "u-3",
    name: "Marcus Johnson",
    email: "marcus@safeguardmeet.app",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
    audioOn: false,
    videoOn: true,
  },
  {
    id: "u-4",
    name: "Aisha Patel",
    email: "aisha@safeguardmeet.app",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces",
    audioOn: true,
    videoOn: false,
    handRaised: true,
  },
  {
    id: "u-5",
    name: "Diego Martinez",
    email: "diego@safeguardmeet.app",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
    audioOn: true,
    videoOn: true,
  },
  {
    id: "u-6",
    name: "Yuki Tanaka",
    email: "yuki@safeguardmeet.app",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
    audioOn: false,
    videoOn: false,
  },
];

export const mockMessages: Message[] = [
  {
    id: "m1",
    userId: "u-2",
    userName: "Sarah Chen",
    avatar: mockParticipants[1].avatar,
    content: "Morning team! Excited for the product review.",
    timestamp: "09:01",
  },
  {
    id: "m2",
    userId: "u-3",
    userName: "Marcus Johnson",
    avatar: mockParticipants[2].avatar,
    content: "Sharing my screen now — let me know if you can see the dashboard.",
    timestamp: "09:03",
  },
  {
    id: "m3",
    userId: "u-you",
    userName: "Hydan Koech",
    avatar: currentUser.avatar,
    content: "Looks great. Let's drill into the conversion funnel.",
    timestamp: "09:04",
  },
  {
    id: "m4",
    userId: "u-4",
    userName: "Aisha Patel",
    avatar: mockParticipants[3].avatar,
    content: "Quick question on the Q3 roadmap — when you have a sec 🙋‍♀️",
    timestamp: "09:06",
  },
];

export const mockFiles: SharedFile[] = [
  { id: "f1", name: "Q3-Roadmap.pdf", size: "2.4 MB", uploadedBy: "Sarah Chen", uploadedAt: "09:02", type: "pdf" },
  { id: "f2", name: "Design-System-v3.fig", size: "8.1 MB", uploadedBy: "Marcus Johnson", uploadedAt: "09:05", type: "fig" },
  { id: "f3", name: "Meeting-Notes.docx", size: "412 KB", uploadedBy: "Hydan Koech", uploadedAt: "09:10", type: "doc" },
];

export const mockRooms: Room[] = [
  {
    id: "r1",
    roomId: "sgm-design-sync",
    name: "Weekly Design Sync",
    createdBy: "Sarah Chen",
    participantsCount: 6,
    scheduledFor: "Today, 10:00 AM",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
  },
  {
    id: "r2",
    roomId: "sgm-eng-standup",
    name: "Engineering Standup",
    createdBy: "Marcus Johnson",
    participantsCount: 12,
    scheduledFor: "Today, 11:30 AM",
    thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop",
  },
  {
    id: "r3",
    roomId: "sgm-product-review",
    name: "Product Review",
    createdBy: "Hydan Koech",
    participantsCount: 8,
    scheduledFor: "Tomorrow, 2:00 PM",
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop",
  },
];

export function generateRoomId(): string {
  const segments = [
    Math.random().toString(36).substring(2, 5),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 5),
  ];
  return segments.join("-");
}
