import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/safeguardmeet-logo.png";
import {
  Video, MessageSquare, Share2, PenTool, Users, ShieldCheck, Sparkles, ArrowRight,
  Lock, Globe, Zap, CheckCircle2, Star, PlayCircle,
} from "lucide-react";

const features = [
  { icon: Video, title: "HD Video Meetings", desc: "Crystal-clear multi-party video powered by WebRTC peer-to-peer." },
  { icon: Share2, title: "Screen Sharing", desc: "Broadcast a window or full screen with one click." },
  { icon: MessageSquare, title: "Encrypted Chat", desc: "Threaded chat with timestamps that lives next to your call." },
  { icon: PenTool, title: "Live Whiteboard", desc: "Draw, sketch and brainstorm with live multi-user cursors." },
  { icon: Users, title: "Smart Rooms", desc: "Spin up rooms with a unique link and invite your team in seconds." },
  { icon: ShieldCheck, title: "Zero-Trust Security", desc: "End-to-end encryption, JWT auth and protected meeting access." },
];

const trustBadges = [
  { icon: Lock, label: "AES-256 Encryption" },
  { icon: ShieldCheck, label: "SOC 2 Ready" },
  { icon: Globe, label: "GDPR Compliant" },
  { icon: Zap, label: "<100ms latency" },
];

const testimonials = [
  {
    name: "Amina Rahman",
    role: "Engineering Lead, Northwind",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    quote: "SafeGuardMeet replaced three tools for us. The whiteboard alone is worth it — it just works, in real time.",
  },
  {
    name: "Daniel Okeke",
    role: "Product Designer, Solstice",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    quote: "The most secure-feeling meeting app I've used. Beautiful, fast, and collaboration is genuinely fun again.",
  },
  {
    name: "Priya Sharma",
    role: "Head of People, Lumen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    quote: "Onboarding our remote team took five minutes. Encryption-first means our legal team finally said yes.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "For small teams getting started.",
    features: ["Up to 25 participants", "60-min meetings", "Whiteboard & chat", "1 GB file sharing"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    suffix: "/user/mo",
    desc: "For growing teams that ship.",
    features: ["Up to 100 participants", "Unlimited meeting length", "Recording & transcripts", "100 GB file sharing", "Priority support"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Dedicated infra & compliance.",
    features: ["SSO / SAML", "Dedicated region", "Custom data retention", "24/7 dedicated CSM", "On-prem option"],
    cta: "Contact sales",
    highlight: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#security" className="hover:text-foreground transition">Security</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Log in</Button></Link>
            <Link to="/register"><Button className="bg-brand-gradient text-primary-foreground shadow-glow hover:opacity-95">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="container relative py-20 md:py-32 text-primary-foreground">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm border border-white/20">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Secure-by-default meetings · End-to-end encrypted</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.02] text-balance">
                Meetings your team trusts.{" "}
                <span className="bg-brand-gradient bg-clip-text text-transparent">Collaboration</span>{" "}
                they love.
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-xl text-balance">
                SafeGuardMeet brings encrypted HD video, real-time chat, file sharing and a live whiteboard into one beautifully secure workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/register">
                  <Button size="lg" className="bg-brand-gradient text-primary-foreground shadow-glow hover:opacity-95 h-12 px-7 text-base">
                    Start a meeting <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-12 px-7 text-base bg-white/5 border-white/30 text-white hover:bg-white/15 hover:text-white">
                    <PlayCircle className="mr-2 h-5 w-5" /> Watch demo
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm text-white/70">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 100 participants</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> AES-256 encrypted</div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              {/* Floating 3D logo */}
              <div className="relative flex items-center justify-center py-6">
                <div className="absolute inset-0 bg-brand-gradient rounded-[40%] blur-3xl opacity-40 animate-pulse" />
                <img
                  src={logo}
                  alt="SafeGuardMeet 3D shield logo"
                  width={420}
                  height={420}
                  className="relative w-72 md:w-96 drop-shadow-[0_25px_60px_rgba(249,115,22,0.55)] animate-[float_6s_ease-in-out_infinite]"
                />
              </div>
              {/* Floating stat cards */}
              <div className="absolute top-6 -left-2 md:left-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-elegant">
                <div className="text-xs text-white/70">Meetings secured</div>
                <div className="font-display text-2xl font-bold">2.4M+</div>
              </div>
              <div className="absolute bottom-4 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-elegant">
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <div className="text-xs text-white/70 mt-0.5">4.9 from 8k+ teams</div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 bg-white/5 backdrop-blur border border-white/10 rounded-xl px-4 py-3">
                <div className="h-9 w-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow">
                  <b.icon className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm text-white/90">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <div className="inline-block rounded-full bg-primary/10 text-primary px-4 py-1 text-sm font-semibold">Everything you need</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-balance">One secure platform. Every conversation.</h2>
            <p className="text-muted-foreground text-lg">Stop juggling tabs. SafeGuardMeet brings meetings, messages and collaboration into a single, encrypted interface.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="p-7 hover:shadow-elegant transition-all hover:-translate-y-1 group border-border/60">
                <div className="h-12 w-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow mb-5 group-hover:scale-110 transition-transform">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security spotlight */}
      <section id="security" className="py-24 bg-secondary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="container relative grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-full bg-white/10 border border-white/20 px-4 py-1 text-sm font-semibold">Security first</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-balance">
              Built like a vault. Feels like a chat app.
            </h2>
            <p className="text-white/80 text-lg">
              Every call, message and file is encrypted in transit and at rest. You control who joins, what they see, and where data lives.
            </p>
            <ul className="space-y-3">
              {[
                "End-to-end encrypted media streams",
                "JWT-secured signaling with rotating keys",
                "Per-room access controls & waiting rooms",
                "Audit logs for admins, by default",
              ].map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-brand-gradient rounded-[2rem] blur-2xl opacity-30" />
            <img
              src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=900&h=700&fit=crop"
              alt="Secure team meeting on SafeGuardMeet"
              className="relative rounded-2xl shadow-elegant w-full"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/40">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&h=700&fit=crop"
              alt="Collaborative whiteboard session"
              className="rounded-2xl shadow-elegant w-full"
            />
            <div className="space-y-8">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-balance">From idea to action in 60 seconds.</h2>
              {[
                { n: "01", t: "Create your workspace", d: "Sign up free and invite your team in seconds." },
                { n: "02", t: "Start or join a room", d: "Generate a unique encrypted room link or join with a code." },
                { n: "03", t: "Collaborate in real-time", d: "Talk, type, draw and ship — all in one place." },
              ].map((s) => (
                <div key={s.n} className="flex gap-5">
                  <div className="text-3xl font-display font-bold bg-brand-gradient bg-clip-text text-transparent">{s.n}</div>
                  <div>
                    <h3 className="font-display font-semibold text-xl">{s.t}</h3>
                    <p className="text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <div className="inline-block rounded-full bg-primary/10 text-primary px-4 py-1 text-sm font-semibold">Loved by teams</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-balance">Trusted by 8,000+ modern teams.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-7 hover:shadow-elegant transition border-border/60">
                <div className="flex items-center gap-1 text-primary mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} loading="lazy" className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-muted/40">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <div className="inline-block rounded-full bg-primary/10 text-primary px-4 py-1 text-sm font-semibold">Pricing</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-balance">Simple plans. Serious value.</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <Card key={p.name} className={`p-8 border-border/60 ${p.highlight ? "ring-2 ring-primary shadow-glow scale-[1.02] bg-gradient-to-b from-background to-primary/5" : ""}`}>
                {p.highlight && (
                  <div className="inline-block rounded-full bg-brand-gradient text-primary-foreground px-3 py-1 text-xs font-semibold mb-3">Most popular</div>
                )}
                <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  {p.suffix && <span className="text-muted-foreground text-sm">{p.suffix}</span>}
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block mt-7">
                  <Button className={`w-full h-11 ${p.highlight ? "bg-brand-gradient text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground hover:opacity-90"}`}>
                    {p.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <Card className="p-12 md:p-16 bg-hero-gradient text-primary-foreground border-0 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-balance">Ready to make every meeting safer?</h2>
                <p className="text-white/80 text-lg mb-8">Join thousands of teams collaborating securely on SafeGuardMeet. Free forever for small teams.</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button size="lg" className="bg-brand-gradient text-primary-foreground shadow-glow h-12 px-8 text-base">
                      Create free account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white/5 border-white/30 text-white hover:bg-white/15 hover:text-white">
                      Talk to sales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <img src={logo} alt="SafeGuardMeet logo" width={300} height={300} loading="lazy" className="w-64 drop-shadow-[0_20px_50px_rgba(249,115,22,0.5)] animate-[float_6s_ease-in-out_infinite]" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="text-sm text-muted-foreground">© 2026 SafeGuardMeet by Hydan Koech. All rights reserved.</div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-18px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default Index;
