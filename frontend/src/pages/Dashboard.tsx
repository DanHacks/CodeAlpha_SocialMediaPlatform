import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { mockRooms, generateRoomId } from "@/lib/mockData";
import { roomStore, makeDefault, defaultRoomPhotos, RoomSettings } from "@/lib/roomStore";
import { Video, Plus, Calendar, LogOut, Users, ArrowRight, Copy, Camera, Shield } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [photo, setPhoto] = useState<string>(defaultRoomPhotos[0]);
  const [settings, setSettings] = useState<RoomSettings>({
    allowChat: true,
    allowReactions: true,
    allowParticipantScreenShare: true,
    allowParticipantWhiteboard: true,
    muteOnEntry: false,
  });
  const [generatedId, setGeneratedId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setNewRoomName("");
    setPhoto(defaultRoomPhotos[0]);
    setGeneratedId("");
  };

  const startInstant = () => {
    const id = generateRoomId();
    if (user) roomStore.upsert(makeDefault(id, user.id, user.name, "Instant meeting"));
    navigate(`/room/${id}`);
  };

  const join = () => {
    if (!joinCode.trim()) { toast.error("Enter a room code"); return; }
    navigate(`/room/${joinCode.trim()}`);
  };

  const createRoom = () => {
    if (!user) return;
    const id = generateRoomId();
    const meta = makeDefault(id, user.id, user.name, newRoomName || "Untitled meeting", photo);
    meta.settings = settings;
    roomStore.upsert(meta);
    setGeneratedId(id);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${generatedId}`);
    toast.success("Link copied to clipboard");
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Image must be under 4MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-semibold leading-tight">{user?.name}</div>
                <div className="text-muted-foreground text-xs">{user?.email}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10 space-y-10">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Good to see you, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-lg">Start a meeting, join with a code, or schedule for later.</p>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="p-7 cursor-pointer hover:shadow-elegant transition group" onClick={startInstant}>
            <div className="h-14 w-14 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow mb-4 group-hover:scale-110 transition">
              <Video className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-xl mb-1">Start instant meeting</h3>
            <p className="text-muted-foreground text-sm">Spin up a room and start talking now.</p>
          </Card>

          <Dialog open={newRoomOpen} onOpenChange={(o) => { setNewRoomOpen(o); if (!o) resetDialog(); }}>
            <DialogTrigger asChild>
              <Card className="p-7 cursor-pointer hover:shadow-elegant transition group">
                <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Plus className="h-7 w-7 text-secondary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl mb-1">New room with link</h3>
                <p className="text-muted-foreground text-sm">Generate a sharable invite link.</p>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create a meeting room</DialogTitle></DialogHeader>
              {!generatedId ? (
                <div className="space-y-5">
                  {/* Room photo */}
                  <div className="space-y-2">
                    <Label>Room photo</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="relative h-20 w-28 rounded-lg overflow-hidden border-2 border-dashed border-primary/40 hover:border-primary transition group flex-shrink-0"
                      >
                        <img src={photo} alt="Room cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Camera className="h-5 w-5" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-2">Click to upload, or pick a preset:</p>
                        <div className="flex gap-1.5">
                          {defaultRoomPhotos.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPhoto(p)}
                              className={`h-8 w-12 rounded overflow-hidden border-2 transition ${photo === p ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                            >
                              <img src={p} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
                  </div>

                  <div className="space-y-2">
                    <Label>Room name</Label>
                    <Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Design Sync" />
                  </div>

                  {/* Privileges */}
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Shield className="h-4 w-4 text-primary" /> Participant privileges
                    </div>
                    <PrivToggle label="Allow chat" checked={settings.allowChat} onChange={(v) => setSettings((s) => ({ ...s, allowChat: v }))} />
                    <PrivToggle label="Allow reactions" checked={settings.allowReactions} onChange={(v) => setSettings((s) => ({ ...s, allowReactions: v }))} />
                    <PrivToggle label="Allow participants to share screen" checked={settings.allowParticipantScreenShare} onChange={(v) => setSettings((s) => ({ ...s, allowParticipantScreenShare: v }))} />
                    <PrivToggle label="Allow participants to use whiteboard" checked={settings.allowParticipantWhiteboard} onChange={(v) => setSettings((s) => ({ ...s, allowParticipantWhiteboard: v }))} />
                    <PrivToggle label="Mute participants on entry" checked={settings.muteOnEntry} onChange={(v) => setSettings((s) => ({ ...s, muteOnEntry: v }))} />
                  </div>

                  <Button onClick={createRoom} className="w-full bg-brand-gradient text-primary-foreground">Generate room</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden border">
                    <img src={photo} alt="" className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <div className="font-semibold">{newRoomName || "Untitled meeting"}</div>
                      <div className="text-xs text-muted-foreground">You are the host</div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted p-3 flex items-center justify-between gap-2 min-w-0">
                    <code className="text-sm truncate flex-1 min-w-0 block">{window.location.origin}/room/{generatedId}</code>
                    <Button size="icon" variant="ghost" onClick={copyLink} className="flex-shrink-0"><Copy className="h-4 w-4" /></Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => navigate(`/room/${generatedId}`)} className="w-full bg-brand-gradient text-primary-foreground">
                      Join now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Card className="p-7">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-secondary" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3">Join with code</h3>
            <div className="flex gap-2">
              <Input placeholder="abc-defg-hij" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
              <Button onClick={join}>Join</Button>
            </div>
          </Card>
        </div>

        {/* Upcoming meetings */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold">Upcoming meetings</h2>
            <Button variant="ghost" className="gap-2"><Calendar className="h-4 w-4" /> View calendar</Button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {mockRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden hover:shadow-elegant transition group cursor-pointer" onClick={() => navigate(`/room/${room.roomId}`)}>
                <div className="aspect-video overflow-hidden">
                  <img src={room.thumbnail} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <div className="p-5">
                  <div className="text-xs text-primary font-semibold mb-1">{room.scheduledFor}</div>
                  <h3 className="font-display font-bold text-lg mb-1">{room.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {room.participantsCount} participants
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary">Join →</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

function PrivToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default Dashboard;
