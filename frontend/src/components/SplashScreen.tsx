import { useEffect, useState } from "react";
import logo from "@/assets/safeguardmeet-logo.png";

interface SplashScreenProps {
  name?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({ name, onComplete, duration = 2200 }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration - 400);
    const doneTimer = setTimeout(() => onComplete?.(), duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-hero-gradient transition-opacity duration-500 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="Loading SafeGuardMeet"
    >
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-primary/30 blur-3xl animate-pulse" style={{ animationDelay: "0.6s" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      {/* Twinkling particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-1 w-1 rounded-full bg-white/70 animate-ping"
          style={{
            top: `${(i * 53) % 100}%`,
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 6) * 0.25}s`,
            animationDuration: `${1.4 + (i % 4) * 0.3}s`,
          }}
        />
      ))}

      <div className="relative flex flex-col items-center text-center px-6">
        {/* Rotating ring */}
        <div className="relative h-44 w-44 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 border-t-primary animate-spin" style={{ animationDuration: "2.4s" }} />
          <div className="absolute inset-3 rounded-full border border-white/10 border-b-primary/70 animate-spin" style={{ animationDuration: "3.2s", animationDirection: "reverse" }} />

          {/* Pulsing glow behind logo */}
          <div className="absolute inset-6 rounded-full bg-brand-gradient blur-2xl opacity-70 animate-pulse" />

          {/* Logo */}
          <img
            src={logo}
            alt="SafeGuardMeet"
            className="relative h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(249,115,22,0.6)] animate-scale-in"
            style={{ animation: "scale-in 0.6s ease-out, float 3s ease-in-out 0.6s infinite" }}
          />
        </div>

        {/* Wordmark */}
        <h1 className="mt-8 font-display text-4xl md:text-5xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          <span className="text-white">Safe</span>
          <span className="bg-brand-gradient bg-clip-text text-transparent">Guard</span>
          <span className="text-white">Meet</span>
        </h1>

        {name && (
          <p className="mt-3 text-lg text-white/80 animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
            Welcome, <span className="font-semibold text-white">{name}</span>
          </p>
        )}

        {/* Loading bar */}
        <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 bg-brand-gradient rounded-full animate-[splash-slide_1.4s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes splash-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
