import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-surface text-muted border-border",
    ok: "bg-accent-soft text-accent border-transparent",
    warn: "bg-surface text-warn border-border",
    danger: "bg-surface text-danger border-border",
    accent: "bg-accent text-accent-fg border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
