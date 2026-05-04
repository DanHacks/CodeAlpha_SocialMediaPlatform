import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, Trash2, Square, Circle as CircleIcon, Minus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockParticipants } from "@/lib/mockData";

type Tool = "pencil" | "eraser" | "rect" | "circle" | "line";

const colors = ["#0a1f44", "#f97316", "#ef4444", "#10b981", "#3b82f6", "#000000"];

// Normalized point (0-1) so different canvas sizes stay in sync
type NPoint = { x: number; y: number };
type StrokeStyle = { color: string; size: number; tool: Tool };

type WBEvent =
  | { kind: "begin"; id: string; peer: string; style: StrokeStyle; point: NPoint }
  | { kind: "extend"; id: string; peer: string; point: NPoint }
  | { kind: "shape"; id: string; peer: string; style: StrokeStyle; from: NPoint; to: NPoint }
  | { kind: "end"; id: string; peer: string }
  | { kind: "clear"; peer: string }
  | { kind: "cursor"; peer: string; peerName: string; peerColor: string; point: NPoint | null }
  | { kind: "sync-request"; peer: string }
  | { kind: "sync-response"; peer: string; strokes: CompletedStroke[] };

type CompletedStroke =
  | { kind: "path"; id: string; style: StrokeStyle; points: NPoint[] }
  | { kind: "shape"; id: string; style: StrokeStyle; from: NPoint; to: NPoint };

type RemoteCursor = { name: string; color: string; point: NPoint; expires: number };

const PEER_ID = `peer-${Math.random().toString(36).slice(2, 9)}`;

interface Props {
  roomId?: string;
}

export function Whiteboard({ roomId = "default" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState(colors[1]);
  const [size, setSize] = useState(4);
  const [activePeers, setActivePeers] = useState<Set<string>>(new Set([PEER_ID]));

  // Strokes by stroke id (for replay on resize / late joiners)
  const strokesRef = useRef<Map<string, CompletedStroke>>(new Map());
  // Live in-progress paths from any peer
  const liveRef = useRef<Map<string, { style: StrokeStyle; points: NPoint[] }>>(new Map());
  // Remote cursors
  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map());

  // Local drawing state
  const drawing = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const startPointRef = useRef<NPoint | null>(null);

  // ---------- Rendering ----------
  const toPx = (canvas: HTMLCanvasElement, p: NPoint) => ({
    x: p.x * canvas.width,
    y: p.y * canvas.height,
  });

  const drawCompleted = useCallback((s: CompletedStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    applyStyle(ctx, s.style);
    if (s.kind === "path") {
      const pts = s.points;
      if (pts.length < 2) {
        const p = toPx(canvas, pts[0]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = s.style.tool === "eraser" ? "#ffffff" : s.style.color;
        ctx.fill();
        return;
      }
      ctx.beginPath();
      const first = toPx(canvas, pts[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const p = toPx(canvas, pts[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    } else {
      drawShape(ctx, canvas, s.style, s.from, s.to);
    }
  }, []);

  const repaintAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach((s) => drawCompleted(s));
    // Live in-progress paths
    liveRef.current.forEach((live) => {
      drawCompleted({ kind: "path", id: "_live", style: live.style, points: live.points });
    });
  }, [drawCompleted]);

  // ---------- Overlay (cursors) ----------
  const renderOverlay = useCallback(() => {
    const c = overlayRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const now = Date.now();
    cursorsRef.current.forEach((cur, peer) => {
      if (cur.expires < now) {
        cursorsRef.current.delete(peer);
        return;
      }
      const p = toPx(c, cur.point);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = cur.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "600 11px Inter, system-ui, sans-serif";
      const label = cur.name;
      const w = ctx.measureText(label).width + 10;
      ctx.fillStyle = cur.color;
      roundRect(ctx, p.x + 10, p.y - 10, w, 18, 9);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(label, p.x + 15, p.y + 3);
    });
  }, []);

  // Cursor animation loop
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      renderOverlay();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [renderOverlay]);

  // ---------- Resize ----------
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      [canvas, overlay].forEach((c) => {
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        c.style.width = `${rect.width}px`;
        c.style.height = `${rect.height}px`;
      });
      repaintAll();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [repaintAll]);

  // ---------- BroadcastChannel sync ----------
  useEffect(() => {
    const ch = new BroadcastChannel(`sgm-whiteboard-${roomId}`);
    channelRef.current = ch;

    const handle = (e: WBEvent) => {
      if ("peer" in e && e.peer === PEER_ID) return; // ignore self
      switch (e.kind) {
        case "begin": {
          liveRef.current.set(e.id, { style: e.style, points: [e.point] });
          setActivePeers((p) => new Set(p).add(e.peer));
          repaintAll();
          break;
        }
        case "extend": {
          const live = liveRef.current.get(e.id);
          if (live) {
            live.points.push(e.point);
            // Incremental draw — fast path
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext("2d")!;
            applyStyle(ctx, live.style);
            const a = toPx(canvas, live.points[live.points.length - 2]);
            const b = toPx(canvas, e.point);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          break;
        }
        case "end": {
          const live = liveRef.current.get(e.id);
          if (live) {
            strokesRef.current.set(e.id, { kind: "path", id: e.id, style: live.style, points: live.points });
            liveRef.current.delete(e.id);
          }
          break;
        }
        case "shape": {
          strokesRef.current.set(e.id, { kind: "shape", id: e.id, style: e.style, from: e.from, to: e.to });
          repaintAll();
          break;
        }
        case "clear": {
          strokesRef.current.clear();
          liveRef.current.clear();
          repaintAll();
          break;
        }
        case "cursor": {
          if (!e.point) cursorsRef.current.delete(e.peer);
          else
            cursorsRef.current.set(e.peer, {
              name: e.peerName,
              color: e.peerColor,
              point: e.point,
              expires: Date.now() + 4000,
            });
          break;
        }
        case "sync-request": {
          // Send current state to late joiner
          ch.postMessage({
            kind: "sync-response",
            peer: PEER_ID,
            strokes: Array.from(strokesRef.current.values()),
          } satisfies WBEvent);
          break;
        }
        case "sync-response": {
          if (strokesRef.current.size === 0) {
            e.strokes.forEach((s) => strokesRef.current.set(s.id, s));
            repaintAll();
          }
          break;
        }
      }
    };

    ch.onmessage = (msg) => handle(msg.data as WBEvent);
    // Ask peers for current state
    ch.postMessage({ kind: "sync-request", peer: PEER_ID } satisfies WBEvent);

    return () => ch.close();
  }, [roomId, repaintAll]);

  const send = (e: WBEvent) => channelRef.current?.postMessage(e);

  // ---------- Simulated remote collaborator (for demo) ----------
  useEffect(() => {
    const peers = mockParticipants.filter((p) => !p.isYou).slice(0, 2);
    const peerStyles = peers.map((p, i) => ({
      id: `sim-${p.id}`,
      name: p.name.split(" ")[0],
      color: i === 0 ? "#3b82f6" : "#10b981",
    }));

    const intervals: ReturnType<typeof setInterval>[] = [];
    peerStyles.forEach((peer, idx) => {
      let t = Math.random() * Math.PI * 2;
      const cx = 0.25 + idx * 0.4;
      const cy = 0.3 + idx * 0.15;
      const r = 0.05 + Math.random() * 0.05;
      let strokeId: string | null = null;
      let segCount = 0;

      const tick = () => {
        const point = { x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r };
        t += 0.25;

        // Cursor
        cursorsRef.current.set(peer.id, {
          name: peer.name,
          color: peer.color,
          point,
          expires: Date.now() + 4000,
        });

        // Occasionally draw a stroke
        if (!strokeId && Math.random() < 0.15) {
          strokeId = `${peer.id}-${Date.now()}`;
          const style: StrokeStyle = { tool: "pencil", color: peer.color, size: 3 };
          liveRef.current.set(strokeId, { style, points: [point] });
          segCount = 0;
        } else if (strokeId) {
          const live = liveRef.current.get(strokeId)!;
          live.points.push(point);
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d")!;
          applyStyle(ctx, live.style);
          const a = toPx(canvas, live.points[live.points.length - 2]);
          const b = toPx(canvas, point);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          segCount++;
          if (segCount > 18) {
            strokesRef.current.set(strokeId, {
              kind: "path",
              id: strokeId,
              style: live.style,
              points: live.points,
            });
            liveRef.current.delete(strokeId);
            strokeId = null;
          }
        }
      };
      intervals.push(setInterval(tick, 120 + idx * 60));
    });
    setActivePeers((p) => {
      const n = new Set(p);
      peerStyles.forEach((x) => n.add(x.id));
      return n;
    });

    return () => intervals.forEach(clearInterval);
  }, []);

  // ---------- Pointer handlers ----------
  const getNorm = (e: React.PointerEvent): NPoint => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const point = getNorm(e);
    startPointRef.current = point;
    const id = `${PEER_ID}-${Date.now()}`;
    currentIdRef.current = id;
    const style: StrokeStyle = { tool, color, size };

    if (tool === "pencil" || tool === "eraser") {
      liveRef.current.set(id, { style, points: [point] });
      send({ kind: "begin", id, peer: PEER_ID, style, point });
      // Draw a dot immediately
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      applyStyle(ctx, style);
      const p = toPx(canvas, point);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = style.tool === "eraser" ? "#ffffff" : style.color;
      ctx.fill();
    }
  };

  const move = (e: React.PointerEvent) => {
    const point = getNorm(e);
    // Always broadcast cursor
    send({
      kind: "cursor",
      peer: PEER_ID,
      peerName: "You",
      peerColor: color,
      point,
    });

    if (!drawing.current || !currentIdRef.current) return;
    const id = currentIdRef.current;

    if (tool === "pencil" || tool === "eraser") {
      const live = liveRef.current.get(id);
      if (!live) return;
      const prev = live.points[live.points.length - 1];
      live.points.push(point);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      applyStyle(ctx, live.style);
      const a = toPx(canvas, prev);
      const b = toPx(canvas, point);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      send({ kind: "extend", id, peer: PEER_ID, point });
    } else if (startPointRef.current) {
      // Shape preview on overlay
      const overlay = overlayRef.current!;
      const octx = overlay.getContext("2d")!;
      octx.clearRect(0, 0, overlay.width, overlay.height);
      renderOverlay();
      applyStyle(octx, { tool, color, size });
      drawShape(octx, overlay, { tool, color, size }, startPointRef.current, point);
    }
  };

  const end = (e: React.PointerEvent) => {
    if (!drawing.current || !currentIdRef.current) {
      drawing.current = false;
      return;
    }
    const id = currentIdRef.current;
    const point = getNorm(e);

    if (tool === "pencil" || tool === "eraser") {
      const live = liveRef.current.get(id);
      if (live) {
        strokesRef.current.set(id, { kind: "path", id, style: live.style, points: live.points });
        liveRef.current.delete(id);
      }
      send({ kind: "end", id, peer: PEER_ID });
    } else if (startPointRef.current) {
      const style: StrokeStyle = { tool, color, size };
      strokesRef.current.set(id, { kind: "shape", id, style, from: startPointRef.current, to: point });
      send({ kind: "shape", id, peer: PEER_ID, style, from: startPointRef.current, to: point });
      const overlay = overlayRef.current!;
      overlay.getContext("2d")!.clearRect(0, 0, overlay.width, overlay.height);
      repaintAll();
    }

    drawing.current = false;
    currentIdRef.current = null;
    startPointRef.current = null;
  };

  const handleLeave = () => {
    send({ kind: "cursor", peer: PEER_ID, peerName: "You", peerColor: color, point: null });
  };

  const clear = () => {
    strokesRef.current.clear();
    liveRef.current.clear();
    repaintAll();
    send({ kind: "clear", peer: PEER_ID });
  };

  const collaboratorCount = activePeers.size;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background p-2 flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          <ToolBtn active={tool === "pencil"} onClick={() => setTool("pencil")} title="Pencil"><Pencil className="h-4 w-4" /></ToolBtn>
          <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} title="Eraser"><Eraser className="h-4 w-4" /></ToolBtn>
          <ToolBtn active={tool === "rect"} onClick={() => setTool("rect")} title="Rectangle"><Square className="h-4 w-4" /></ToolBtn>
          <ToolBtn active={tool === "circle"} onClick={() => setTool("circle")} title="Circle"><CircleIcon className="h-4 w-4" /></ToolBtn>
          <ToolBtn active={tool === "line"} onClick={() => setTool("line")} title="Line"><Minus className="h-4 w-4" /></ToolBtn>
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition",
                color === c ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <input
          type="range"
          min={1}
          max={20}
          value={size}
          onChange={(e) => setSize(+e.target.value)}
          className="w-24 accent-primary"
        />
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
            <Users className="h-3 w-3" />
            <span className="font-semibold">{collaboratorCount}</span> live
          </div>
          <Button size="sm" variant="ghost" onClick={clear}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-white relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <canvas
          ref={overlayRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={(e) => { end(e); handleLeave(); }}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/90 backdrop-blur rounded-full px-3 py-1 border flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live sync · {collaboratorCount} collaborator{collaboratorCount === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function applyStyle(ctx: CanvasRenderingContext2D, style: StrokeStyle) {
  const dpr = window.devicePixelRatio || 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = (style.tool === "eraser" ? 24 : style.size) * dpr;
  ctx.strokeStyle = style.tool === "eraser" ? "#ffffff" : style.color;
  ctx.globalCompositeOperation = style.tool === "eraser" ? "destination-out" : "source-over";
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  style: StrokeStyle,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const a = { x: from.x * canvas.width, y: from.y * canvas.height };
  const b = { x: to.x * canvas.width, y: to.y * canvas.height };
  ctx.beginPath();
  if (style.tool === "rect") {
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  } else if (style.tool === "circle") {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const rx = Math.abs(b.x - a.x) / 2;
    const ry = Math.abs(b.y - a.y) / 2;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style.tool === "line") {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ToolBtn({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center transition",
        active ? "bg-brand-gradient text-primary-foreground shadow-glow" : "hover:bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  );
}
