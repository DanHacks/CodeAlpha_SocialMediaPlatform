import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SplashScreen } from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block bg-hero-gradient overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative h-full flex flex-col justify-between p-12 text-primary-foreground">
          <Logo />
          <div className="space-y-4 max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight">Secure meetings. Real collaboration.</h2>
            <p className="text-white/80 text-lg">SafeGuardMeet is the encrypted workspace built for the way modern teams actually communicate.</p>
          </div>
          <div className="text-sm text-white/60">© 2026 SafeGuardMeet by Hydan Koech</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10 bg-background">
        <Card className="w-full max-w-md p-8 shadow-elegant">
          <div className="lg:hidden mb-6"><Logo /></div>
          <h1 className="font-display text-3xl font-bold mb-1">{title}</h1>
          <p className="text-muted-foreground mb-6">{subtitle}</p>
          {children}
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </Card>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@safeguardmeet.app");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Welcome back!");
      setSplashName((u as any)?.name || email.split("@")[0]);
    } catch {
      toast.error("Login failed");
      setLoading(false);
    }
  };

  if (splashName) {
    return <SplashScreen name={splashName} onComplete={() => navigate("/dashboard")} />;
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your SafeGuardMeet workspace"
      footer={<>Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Sign up</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full bg-brand-gradient text-primary-foreground shadow-glow h-11" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created!");
      setSplashName(name || email.split("@")[0]);
    } catch {
      toast.error("Registration failed");
      setLoading(false);
    }
  };

  if (splashName) {
    return <SplashScreen name={splashName} onComplete={() => navigate("/dashboard")} />;
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever for small teams"
      footer={<>Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full bg-brand-gradient text-primary-foreground shadow-glow h-11" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
