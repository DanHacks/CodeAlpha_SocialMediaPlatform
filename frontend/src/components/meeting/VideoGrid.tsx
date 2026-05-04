import { Participant } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, VideoOff, Pin, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

const stockBackdrops = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=600&fit=crop",
];

interface VideoGridProps {
  participants: Participant[];
  screenSharingId?: string | null;
}

export function VideoGrid({ participants, screenSharingId }: VideoGridProps) {
  if (screenSharingId) {
    const sharer = participants.find((p) => p.id === screenSharingId);
    const others = participants.filter((p) => p.id !== screenSharingId);
    return (
      <div className="h-full flex flex-col gap-3 p-3">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-secondary shadow-elegant">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&fit=crop"
            alt="Shared screen"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-glow">
            🖥 {sharer?.name} is sharing
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {others.map((p, i) => (
            <ParticipantTile key={p.id} participant={p} index={i} compact />
          ))}
        </div>
      </div>
    );
  }

  const count = participants.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div className={cn("h-full grid gap-3 p-3", cols === 1 && "grid-cols-1", cols === 2 && "grid-cols-2", cols === 3 && "grid-cols-2 md:grid-cols-3")}>
      {participants.map((p, i) => (
        <ParticipantTile key={p.id} participant={p} index={i} />
      ))}
    </div>
  );
}

function ParticipantTile({ participant, index, compact }: { participant: Participant; index: number; compact?: boolean }) {
  const backdrop = stockBackdrops[index % stockBackdrops.length];
  return (
    <div
      className={cn(
        "relative group rounded-2xl overflow-hidden bg-secondary shadow-elegant min-h-[140px]",
        compact && "h-28 w-44 flex-shrink-0",
        participant.isYou && "ring-2 ring-primary"
      )}
    >
      {participant.videoOn ? (
        <img src={backdrop} alt={participant.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <Avatar className="h-20 w-20 ring-4 ring-primary/30">
            <AvatarImage src={participant.avatar} />
            <AvatarFallback className="text-2xl">{participant.name[0]}</AvatarFallback>
          </Avatar>
        </div>
      )}
      {!participant.videoOn && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5">
          <VideoOff className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      {participant.handRaised && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1.5 animate-bounce">
          <Hand className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white text-sm font-medium truncate">
          {participant.audioOn ? <Mic className="h-3.5 w-3.5 text-green-400" /> : <MicOff className="h-3.5 w-3.5 text-destructive" />}
          <span className="truncate">{participant.name}</span>
          {participant.isHost && <span className="text-[10px] bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded ml-1">HOST</span>}
        </div>
        {!compact && (
          <button className="opacity-0 group-hover:opacity-100 transition text-white/80 hover:text-white">
            <Pin className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
