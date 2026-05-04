import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { Whiteboard } from "@/components/meeting/Whiteboard";
import { FilesPanel } from "@/components/meeting/FilesPanel";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { mockParticipants, Participant } from "@/lib/mockData";
import { roomStore, makeDefault, RoomMeta, RoomSettings } from "@/lib/roomStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, PhoneOff, Hand, Smile,
  MessageSquare, Users, FileText, PenTool, Copy, Circle, Settings, Crown, AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SidePanel = "chat" | "people" | "files" | null;
const reactions = ["👍", "❤️", "😂", "🎉", "👏", "🔥"];

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load or create room metadata
  const [room, setRoom] = useState<RoomMeta>(() => {
    if (!roomId) return makeDefault("unknown", user?.id || "guest", user?.name || "Guest");
    let meta = roomStore.get(roomId);
    if (!meta) {
      meta = makeDefault(roomId, user?.id || "guest", user?.name || "Guest", `Meeting ${roomId}`);
      roomStore.upsert(meta);
    }
    return meta;
  });

  // Sync from store (other tabs / panels)
  useEffect(() => roomStore.subscribe((map) => {
    if (roomId && map[roomId]) setRoom(map[roomId]);
  }), [roomId]);

  // Detect ended state
  const [endedDialogOpen, setEndedDialogOpen] = useState(false);
  useEffect(() => {
    if (room.ended && user?.id !== room.hostId) {
      setEndedDialogOpen(true);
    }
  }, [room.ended, room.hostId, user?.id]);

  const isHost = user?.id === room.hostId;

  // Participants — patch "you" with current user info
  const [participants, setParticipants] = useState<Participant[]>(() => {
    return mockParticipants.map((p) =>
      p.isYou && user
        ? { ...p, id: user.id, name: `${user.name} (You)`, email: user.email, avatar: user.avatar, isHost, audioOn: !room.settings.muteOnEntry }
        : p
    );
  });

  const [audioOn, setAudioOn] = useState(!room.settings.muteOnEntry);
  const [videoOn, setVideoOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [panel, setPanel] = useState<SidePanel>("chat");
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<null | { type: "screen" | "whiteboard"; sharer: string }>(null);

  const me = participants.find((p) => p.isYou);
  const myId = me?.id || user?.id || "u-you";

  const updateMe = (patch: Partial<Participant>) => {
    setParticipants((prev) => prev.map((p) => (p.isYou ? { ...p, ...patch } : p)));
  };

  const canIRecord = isHost || room.recorderId === myId;

  const toggleAudio = () => { setAudioOn((v) => { updateMe({ audioOn: !v }); return !v; }); };
  const toggleVideo = () => { setVideoOn((v) => { updateMe({ videoOn: !v }); return !v; }); };

  const toggleScreen = () => {
    if (!sharingScreen) {
      // Want to start
      if (!isHost && !room.settings.allowParticipantScreenShare) {
        toast.error("The host has disabled participant screen sharing");
        return;
      }
      if (room.activeScreenSharer && room.activeScreenSharer.id !== myId) {
        setConflictDialog({ type: "screen", sharer: room.activeScreenSharer.name });
        return;
      }
      roomStore.patch(room.roomId, { activeScreenSharer: { id: myId, name: me?.name || "You" } });
      setSharingScreen(true);
      updateMe({ isScreenSharing: true });
      if (boardOpen) toggleBoardInternal(false);
      toast.success("Screen sharing started");
    } else {
      roomStore.patch(room.roomId, { activeScreenSharer: null });
      setSharingScreen(false);
      updateMe({ isScreenSharing: false });
      toast.success("Screen sharing stopped");
    }
  };

  const toggleBoardInternal = (next: boolean) => {
    setBoardOpen(next);
    if (next) {
      roomStore.patch(room.roomId, { activeWhiteboardSharer: { id: myId, name: me?.name || "You" } });
    } else if (room.activeWhiteboardSharer?.id === myId) {
      roomStore.patch(room.roomId, { activeWhiteboardSharer: null });
    }
  };

  const toggleBoard = () => {
    if (!boardOpen) {
      if (!isHost && !room.settings.allowParticipantWhiteboard) {
        toast.error("The host has disabled the whiteboard for participants");
        return;
      }
      if (room.activeWhiteboardSharer && room.activeWhiteboardSharer.id !== myId) {
        setConflictDialog({ type: "whiteboard", sharer: room.activeWhiteboardSharer.name });
        return;
      }
      if (sharingScreen) toggleScreen();
      toggleBoardInternal(true);
      toast.success("Whiteboard opened for everyone");
    } else {
      toggleBoardInternal(false);
      toast.success("Whiteboard closed");
    }
  };

  const toggleHand = () => {
    setHandRaised((v) => { updateMe({ handRaised: !v }); toast.success(!v ? "Hand raised ✋" : "Hand lowered"); return !v; });
  };
  const sendReaction = (emoji: string) => {
    if (!room.settings.allowReactions && !isHost) { toast.error("Reactions are disabled"); return; }
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 3000);
    setReactionPickerOpen(false);
  };

  const toggleRecording = () => {
    if (!canIRecord) {
      toast.error(`Only the host or the assigned recorder can record this meeting`);
      return;
    }
    const next = !room.isRecording;
    roomStore.patch(room.roomId, { isRecording: next });
    toast.success(next ? "Recording started" : "Recording stopped");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Meeting link copied");
  };

  const leave = () => {
    if (isHost) {
      // Host leaving ends the meeting for all
      roomStore.end(room.roomId);
      toast.success("You ended the meeting for everyone");
    } else {
      // Clean up any locks held by me
      const patch: Partial<RoomMeta> = {};
      if (room.activeScreenSharer?.id === myId) patch.activeScreenSharer = null;
      if (room.activeWhiteboardSharer?.id === myId) patch.activeWhiteboardSharer = null;
      if (Object.keys(patch).length) roomStore.patch(room.roomId, patch);
      toast.success("You left the meeting");
    }
    navigate("/dashboard");
  };

  const screenSharingId = sharingScreen
    ? myId
    : participants.find((p) => p.isScreenSharing && !p.isYou)?.id || null;

  // Participant list (for recorder picker) — host + the mock others
  const recorderOptions = useMemo(
    () => participants.map((p) => ({ id: p.id, name: p.isYou ? `${user?.name || "You"} (You)` : p.name })),
    [participants, user?.name],
  );

  const updateSettings = (patch: Partial<RoomSettings>) => {
    roomStore.patch(room.roomId, { settings: { ...room.settings, ...patch } });
  };

  return (
    <div className="h-screen flex flex-col bg-secondary text-primary-foreground overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-secondary/95 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div className="hidden md:flex items-center gap-3">
            <img src={room.photo} alt={room.name} className="h-9 w-9 rounded-lg object-cover" />
            <div className="text-sm">
              <div className="font-semibold flex items-center gap-2">
                {room.name}
                {isHost && <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5"><Crown className="h-3 w-3" /> Host</span>}
              </div>
              <div className="text-white/60 text-xs">{roomId} · {participants.length} participants</div>
            </div>
            <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy link
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {room.isRecording && (
            <div className="flex items-center gap-1.5 bg-destructive/20 text-destructive border border-destructive/40 rounded-full px-3 py-1 text-xs font-semibold">
              <Circle className="h-2.5 w-2.5 fill-current animate-pulse" /> REC
            </div>
          )}
          {isHost && (
            <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-1.5" /> Settings
            </Button>
          )}
          <div className="text-sm text-white/60 hidden md:block">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative">
          {boardOpen ? (
            <BoardStage participants={participants} roomId={roomId} sharerName={room.activeWhiteboardSharer?.name} />
          ) : (
            <VideoGrid participants={participants} screenSharingId={screenSharingId} />
          )}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {floatingReactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-5xl"
                style={{ animation: "floatUp 3s ease-out forwards", left: `${30 + Math.random() * 40}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        {panel && (
          <aside className="w-[380px] flex-shrink-0 bg-background text-foreground border-l border-white/10 flex flex-col">
            {panel === "chat" && <PanelHeader title="Chat" onClose={() => setPanel(null)} />}
            {panel === "people" && <PanelHeader title="Participants" onClose={() => setPanel(null)} />}
            {panel === "files" && <PanelHeader title="Files" onClose={() => setPanel(null)} />}
            <div className="flex-1 overflow-hidden">
              {panel === "chat" && <ChatPanel />}
              {panel === "people" && <ParticipantsPanel participants={participants} />}
              {panel === "files" && <FilesPanel />}
            </div>
          </aside>
        )}
      </div>

      {/* Controls */}
      <footer className="bg-secondary/95 backdrop-blur border-t border-white/10 px-4 py-3 z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Connected · Encrypted
          </div>
          <div className="flex items-center gap-2 mx-auto flex-wrap justify-center">
            <ControlButton active={audioOn} onClick={toggleAudio} label={audioOn ? "Mute" : "Unmute"} danger={!audioOn}>
              {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton active={videoOn} onClick={toggleVideo} label={videoOn ? "Stop video" : "Start video"} danger={!videoOn}>
              {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </ControlButton>
            <ControlButton active={sharingScreen} onClick={toggleScreen} label="Share screen" highlight={sharingScreen}>
              {sharingScreen ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
            </ControlButton>
            <ControlButton active={boardOpen} onClick={toggleBoard} label="Whiteboard" highlight={boardOpen}>
              <PenTool className="h-5 w-5" />
            </ControlButton>
            <ControlButton active={handRaised} onClick={toggleHand} label="Raise hand" highlight={handRaised}>
              <Hand className="h-5 w-5" />
            </ControlButton>
            <div className="relative">
              <ControlButton active onClick={() => setReactionPickerOpen((v) => !v)} label="React">
                <Smile className="h-5 w-5" />
              </ControlButton>
              {reactionPickerOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-background text-foreground rounded-full shadow-elegant border p-2 flex gap-1">
                  {reactions.map((r) => (
                    <button key={r} onClick={() => sendReaction(r)} className="h-9 w-9 text-2xl hover:bg-muted rounded-full transition">{r}</button>
                  ))}
                </div>
              )}
            </div>
            <ControlButton
              active={room.isRecording}
              onClick={toggleRecording}
              label={canIRecord ? "Record" : "Recording locked"}
              highlight={room.isRecording}
            >
              <Circle className={cn("h-5 w-5", room.isRecording && "fill-current")} />
            </ControlButton>
            <div className="w-px h-8 bg-white/20 mx-1" />
            <ControlButton active={panel === "people"} onClick={() => setPanel(panel === "people" ? null : "people")} label="People" highlight={panel === "people"}>
              <Users className="h-5 w-5" />
            </ControlButton>
            <ControlButton active={panel === "chat"} onClick={() => setPanel(panel === "chat" ? null : "chat")} label="Chat" highlight={panel === "chat"}>
              <MessageSquare className="h-5 w-5" />
            </ControlButton>
            <ControlButton active={panel === "files"} onClick={() => setPanel(panel === "files" ? null : "files")} label="Files" highlight={panel === "files"}>
              <FileText className="h-5 w-5" />
            </ControlButton>
            <Button onClick={() => setLeaveOpen(true)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 ml-2 h-12 rounded-full px-5">
              <PhoneOff className="h-5 w-5" /> {isHost ? "End" : "Leave"}
            </Button>
          </div>
          <div className="hidden md:block w-32" />
        </div>
      </footer>

      {/* Settings dialog (host only) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Room settings</DialogTitle>
            <DialogDescription>Manage privileges and assign who can record.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="text-sm font-semibold">Participant privileges</div>
              <SettingRow label="Allow chat" checked={room.settings.allowChat} onChange={(v) => updateSettings({ allowChat: v })} />
              <SettingRow label="Allow reactions" checked={room.settings.allowReactions} onChange={(v) => updateSettings({ allowReactions: v })} />
              <SettingRow label="Allow participants to share screen" checked={room.settings.allowParticipantScreenShare} onChange={(v) => updateSettings({ allowParticipantScreenShare: v })} />
              <SettingRow label="Allow participants to use whiteboard" checked={room.settings.allowParticipantWhiteboard} onChange={(v) => updateSettings({ allowParticipantWhiteboard: v })} />
              <SettingRow label="Mute participants on entry" checked={room.settings.muteOnEntry} onChange={(v) => updateSettings({ muteOnEntry: v })} />
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <Label className="text-sm font-semibold">Designated recorder</Label>
              <p className="text-xs text-muted-foreground">Choose who is allowed to start/stop the recording.</p>
              <Select value={room.recorderId || ""} onValueChange={(v) => roomStore.patch(room.roomId, { recorderId: v })}>
                <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                <SelectContent>
                  {recorderOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}{p.id === room.hostId ? " · Host" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)} className="bg-brand-gradient text-primary-foreground">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sharing conflict dialog */}
      <AlertDialog open={!!conflictDialog} onOpenChange={(o) => !o && setConflictDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              {conflictDialog?.type === "screen" ? "Someone is already sharing their screen" : "Whiteboard is already in use"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{conflictDialog?.sharer}</strong> is currently sharing the {conflictDialog?.type}.
              Only one person can share a {conflictDialog?.type} at a time. Please wait or ask them to end theirs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Wait</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success(`Asked ${conflictDialog?.sharer} to stop sharing`); setConflictDialog(null); }}>
              Ask them to stop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirm */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isHost ? "End meeting for everyone?" : "Leave meeting?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isHost
                ? "You are the host. Leaving will end this meeting for all participants and disconnect everyone."
                : "You can rejoin anytime using the same link. The meeting will continue without you."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={leave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isHost ? "End meeting" : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ended-by-host dialog (for non-hosts) */}
      <AlertDialog open={endedDialogOpen} onOpenChange={setEndedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>The host ended this meeting</AlertDialogTitle>
            <AlertDialogDescription>
              {room.hostName} has ended the meeting for everyone. You'll be returned to your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/dashboard")}>Back to dashboard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -400px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

function SettingRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function BoardStage({ participants, roomId, sharerName }: { participants: Participant[]; roomId?: string; sharerName?: string }) {
  return (
    <div className="h-full flex flex-col gap-3 p-3">
      <div className="flex-1 relative rounded-2xl overflow-hidden bg-white shadow-elegant min-h-0">
        <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-glow flex items-center gap-1.5">
          <PenTool className="h-3 w-3" /> Whiteboard · presented by {sharerName || "you"}
        </div>
        <Whiteboard roomId={roomId} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
        {participants.map((p) => (
          <ThumbTile key={p.id} participant={p} />
        ))}
      </div>
    </div>
  );
}

function ThumbTile({ participant }: { participant: Participant }) {
  return (
    <div className={cn(
      "relative h-24 w-36 flex-shrink-0 rounded-xl overflow-hidden bg-secondary shadow",
      participant.isYou && "ring-2 ring-primary"
    )}>
      {participant.videoOn ? (
        <img
          src={`https://images.unsplash.com/photo-${["1573497019940-1c28c88b4f3e", "1494790108377-be9c29b29330", "1500648767791-00dcc994a43e", "1573496359142-b8d87734a5a2", "1535713875002-d1d0cf377fde", "1438761681033-6461ffad8d80"][Math.abs(participant.id.charCodeAt(0)) % 6]}?w=400&h=300&fit=crop`}
          alt={participant.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Avatar className="h-12 w-12 ring-2 ring-primary/30">
            <AvatarImage src={participant.avatar} />
            <AvatarFallback>{participant.name[0]}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 flex items-center gap-1 text-white text-xs font-medium">
        {participant.audioOn ? <Mic className="h-3 w-3 text-green-400" /> : <MicOff className="h-3 w-3 text-destructive" />}
        <span className="truncate">{participant.name}</span>
      </div>
    </div>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <h3 className="font-display font-bold text-lg">{title}</h3>
      <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">✕</Button>
    </div>
  );
}

function ControlButton({ children, onClick, label, active, danger, highlight }: { children: React.ReactNode; onClick: () => void; label: string; active?: boolean; danger?: boolean; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "h-12 w-12 rounded-full flex items-center justify-center transition relative group",
        danger && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        highlight && !danger && "bg-brand-gradient text-primary-foreground shadow-glow",
        !danger && !highlight && "bg-white/10 hover:bg-white/20 text-white"
      )}
    >
      {children}
      <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition shadow">
        {label}
      </span>
    </button>
  );
}

export default MeetingRoom;
