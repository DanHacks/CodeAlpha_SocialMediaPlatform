import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message, mockMessages, currentUser, mockParticipants } from "@/lib/mockData";
import { Send, Smile } from "lucide-react";

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate incoming messages
  useEffect(() => {
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
  }, []);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages((prev) => [...prev, {
      id: `m-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.avatar,
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isYou = m.userId === currentUser.id;
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
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1" />
        <Button type="submit" size="icon" className="bg-brand-gradient text-primary-foreground"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
