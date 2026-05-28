import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message, mockMessages, mockParticipants } from "@/lib/mockData";
import { Send, Smile } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { api, isApiEnabled } from "@/lib/api";

interface Props { roomId?: string }

export function ChatPanel({ roomId }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();
  const live = !!(socket && roomId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load history + subscribe to live events when backend is wired.
  useEffect(() => {
    if (!live || !roomId) return;
    let mounted = true;
    if (isApiEnabled()) {
      api.listMessages(roomId).then(({ messages: hist }) => {
        if (!mounted) return;
        setMessages(hist.map((m) => ({
          id: m.id,
          userId: m.userId,
          userName: m.userName,
          avatar: "",
          content: m.text,
          timestamp: new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));
      }).catch(() => { /* keep mock */ });
    }
    const onNew = (m: { id: string; userId: string; userName: string; text: string; at: number }) => {
      setMessages((prev) => [...prev, {
        id: m.id, userId: m.userId, userName: m.userName, avatar: "",
        content: m.text,
        timestamp: new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    };
    socket!.on("chat:new", onNew);
    return () => { mounted = false; socket!.off("chat:new", onNew); };
  }, [live, roomId, socket]);

  // Mock auto-replies only when not live
  useEffect(() => {
    if (live) return;
    const replies = [
      { user: mockParticipants[1], text: "Yes I can see it perfectly 👍" },
      { user: mockParticipants[2], text: "Recording is on, fyi." },
      { user: mockParticipants[4], text: "Drop the doc when you have a sec." },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= replies.length) { clearInterval(interval); return; }
      const r = replies[i++];
      setMessages((prev) => [...prev, {
        id: `auto-${Date.now()}`,
        userId: r.user.id,
        userName: r.user.name,
        avatar: r.user.avatar,
        content: r.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 12000);
    return () => clearInterval(interval);
  }, [live]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      if (live && user) {
        socket!.emit("chat:send", { text: value, userName: user.name });
      } else {
        setMessages((prev) => [...prev, {
          id: `m-${Date.now()}`,
          userId: user?.id || "u-you",
          userName: user?.name || "You",
          avatar: user?.avatar || "",
          content: value,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
      setText("");
    } finally {
      setSending(false);
    }
  };

  const myId = user?.id || "u-you";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isYou = m.userId === myId;
          return (
            <div key={m.id} className={`flex gap-2.5 ${isYou ? "flex-row-reverse" : ""}`}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={m.avatar} />
                <AvatarFallback>{m.userName[0]}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[80%] ${isYou ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{isYou ? "You" : m.userName}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className={`px-3.5 py-2 rounded-2xl text-sm ${isYou ? "bg-brand-gradient text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t p-3 flex gap-2 bg-background">
        <Button type="button" size="icon" variant="ghost"><Smile className="h-4 w-4" /></Button>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={live ? "Type a message..." : "Type a message (local preview)..."} className="flex-1" />
        <Button type="submit" size="icon" disabled={sending || !text.trim()} className="bg-brand-gradient text-primary-foreground"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
