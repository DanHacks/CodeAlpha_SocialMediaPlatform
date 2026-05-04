import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/lib/mockData";
import { Mic, MicOff, Video as VideoIcon, VideoOff, Hand } from "lucide-react";

export function ParticipantsPanel({ participants }: { participants: Participant[] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="text-sm text-muted-foreground">In this meeting</div>
        <div className="font-display text-2xl font-bold">{participants.length} people</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition">
            <Avatar className="h-9 w-9">
              <AvatarImage src={p.avatar} />
              <AvatarFallback>{p.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate flex items-center gap-1.5">
                {p.name}
                {p.isHost && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">HOST</span>}
                {p.handRaised && <Hand className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">{p.email}</div>
            </div>
            <div className="flex gap-1">
              {p.audioOn ? <Mic className="h-4 w-4 text-muted-foreground" /> : <MicOff className="h-4 w-4 text-destructive" />}
              {p.videoOn ? <VideoIcon className="h-4 w-4 text-muted-foreground" /> : <VideoOff className="h-4 w-4 text-destructive" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
