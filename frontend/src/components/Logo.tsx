import logo from "@/assets/safeguardmeet-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
};

const textSizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-brand-gradient blur-lg opacity-50 rounded-full" />
        <img
          src={logo}
          alt="SafeGuardMeet logo"
          width={64}
          height={64}
          className={cn(sizes[size], "object-contain relative drop-shadow-[0_4px_12px_rgba(249,115,22,0.45)]")}
        />
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight leading-none", textSizes[size])}>
          <span className="text-secondary">Safe</span>
          <span className="bg-brand-gradient bg-clip-text text-transparent">Guard</span>
          <span className="text-secondary">Meet</span>
        </span>
      )}
    </div>
  );
}
