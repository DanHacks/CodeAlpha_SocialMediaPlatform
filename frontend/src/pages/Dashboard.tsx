import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { mockRooms, generateRoomId } from "@/lib/mockData";
import { roomStore, makeDefault, defaultRoomPhotos, RoomSettings, RoomMeta } from "@/lib/roomStore";
import { api, isApiEnabled, apiRoomToMeta } from "@/lib/api";
import { Video, Plus, Calendar, LogOut, Users, ArrowRight, Copy, Camera, Shield, Trash2, Cloud, CloudOff } from "lucide-react";
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
  const [creating, setCreating] = useState(false);
  const [myRooms, setMyRooms] = useState<RoomMeta[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshRooms = async () => {
    if (isApiEnabled()) {
      try {
        setLoadingRooms(true);
        const { rooms } = await api.listRooms();
        setMyRooms(rooms.map(apiRoomToMeta));
      } catch (e) {
        console.error(e);
        toast.error("Could not load your rooms");
      } finally {
        setLoadingRooms(false);
      }
    } else if (user) {
      // local fallback: read from localStorage roomStore
      const all = JSON.parse(localStorage.getItem("safeguardmeet.rooms.v1") || "{}") as Record<string, RoomMeta>;
      setMyRooms(Object.values(all).filter((r) => r.hostId === user.id).sort((a, b) => b.createdAt - a.createdAt));
    }
  };

  useEffect(() => { refreshRooms(); /* eslint-disable-next-line */ }, [user?.id]);
  useEffect(() => roomStore.subscribe(() => { if (!isApiEnabled()) refreshRooms(); }), []);

  const resetDialog = () => {
    setNewRoomName("");
    setPhoto(defaultRoomPhotos[0]);
    setGeneratedId("");
  };

  const startInstant = async () => {
    if (!user) return;
    if (isApiEnabled()) {
      try {
        const room = await api.createRoom({ name: "Instant meeting", photo: defaultRoomPhotos[0], settings });
        roomStore.upsert(apiRoomToMeta(room));
        navigate(`/room/${room.id}`);
      } catch {
        toast.error("Backend unreachable, starting locally");
        const id = generateRoomId();
        roomStore.upsert(makeDefault(id, user.id, user.name, "Instant meeting"));
        navigate(`/room/${id}`);
      }
      return;
    }
    const id = generateRoomId();
    roomStore.upsert(makeDefault(id, user.id, user.name, "Instant meeting"));
    navigate(`/room/${id}`);
  };

  const join = () => {
    if (!joinCode.trim()) { toast.error("Enter a room code"); return; }
    navigate(`/room/${joinCode.trim()}`);
  };

  const createRoom = async () => {
    if (!user) return;
    setCreating(true);
    try {
      if (isApiEnabled()) {
        const room = await api.createRoom({ name: newRoomName || "Untitled meeting", photo, settings });
        roomStore.upsert(apiRoomToMeta(room));
        setGeneratedId(room.id);
      } else {
        const id = generateRoomId();
        const meta = makeDefault(id, user.id, user.name, newRoomName || "Untitled meeting", photo);
        meta.settings = settings;
        roomStore.upsert(meta);
        setGeneratedId(id);
      }
      refreshRooms();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const removeRoom = async (id: string) => {
    try {
      if (isApiEnabled()) await api.deleteRoom(id);
      // also wipe local meta if present
      const all = JSON.parse(localStorage.getItem("safeguardmeet.rooms.v1") || "{}");
      delete all[id];
      localStorage.setItem("safeguardmeet.rooms.v1", JSON.stringify(all));
      toast.success("Room deleted");
      refreshRooms();
    } catch {
      toast.error("Could not delete room");
    }
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
            <div className="hidden md:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border bg-muted/60">
              {isApiEnabled()
                ? (<><Cloud className="h-3.5 w-3.5 text-primary" /> <span>Cloud backend</span></>)
                : (<><CloudOff className="h-3.5 w-3.5 text-muted-foreground" /> <span>Local preview</span></>)}
            </div>
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

                  <Button onClick={createRoom} disabled={creating} className="w-full bg-brand-gradient text-primary-foreground">
                    {creating ? "Creating..." : "Generate room"}
                  </Button>
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

        {/* My rooms (CRUD-backed) */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold">Your rooms</h2>
              <p className="text-muted-foreground text-sm">Rooms you host. Delete to revoke the invite link.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshRooms} disabled={loadingRooms}>Refresh</Button>
          </div>
          {myRooms.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              {loadingRooms ? "Loading..." : "You haven't created any rooms yet. Use “New room with link” above to get started."}
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {myRooms.map((r) => (
                <Card key={r.roomId} className="overflow-hidden hover:shadow-elegant transition group">
                  <div className="aspect-video overflow-hidden cursor-pointer relative" onClick={() => navigate(`/room/${r.roomId}`)}>
                    {r.photo
                      ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      : <div className="w-full h-full bg-brand-gradient" />}
                    {r.ended && (
                      <div className="absolute top-2 right-2 text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">Ended</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-lg mb-1 truncate">{r.name}</h3>
                    <div className="text-xs text-muted-foreground truncate">{r.roomId}</div>
                    <div className="flex items-center justify-between mt-3">
                      <Button size="sm" variant="ghost" className="text-primary" onClick={() => navigate(`/room/${r.roomId}`)}>Join →</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The invite link for <strong>{r.name}</strong> will stop working immediately. This can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeRoom(r.roomId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming (sample) */}
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
