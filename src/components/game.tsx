import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "pv" | "pf" | "karma" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const bg = tone === "pv" ? "bg-pv" : tone === "pf" ? "bg-pf" : "bg-karma";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold tracking-wide text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", bg)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-card/80 p-5 glow backdrop-blur", className)}>{children}</div>;
}

export function PageTitle({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {kicker && <p className="text-xs font-semibold tracking-[0.3em] text-gold">{kicker}</p>}
      <h1 className="mt-1 text-3xl font-bold text-lilac md:text-4xl">{title}</h1>
      {children && <p className="mt-2 text-muted-foreground">{children}</p>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg text-foreground">{value}</div>
    </div>
  );
}
