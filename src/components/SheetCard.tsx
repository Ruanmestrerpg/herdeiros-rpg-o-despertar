import type { Tables } from "@/integrations/supabase/types";
import { Panel, Stat, StatBar } from "@/components/game";
import type { ReactNode } from "react";

export function SheetCard({ s, actions }: { s: Tables<"sheets">; actions?: ReactNode }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-lilac">{s.name}</h3>
          {s.concept && <p className="text-sm text-muted-foreground">{s.concept}</p>}
          {s.weapon && <p className="mt-1 text-xs text-gold">⚔ {s.weapon}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Corpo" value={s.corpo} />
        <Stat label="Mente" value={s.mente} />
        <Stat label="Espírito" value={s.espirito} />
      </div>
      <div className="mt-4 space-y-3">
        <StatBar label="PV" value={s.pv_current ?? 0} max={s.pv_max ?? 0} tone="pv" />
        <StatBar label="PF" value={s.pf_current ?? 0} max={s.pf_max ?? 0} tone="pf" />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat label="Esquiva" value={s.esquiva} />
        <Stat label="Bloqueio" value={s.bloqueio} />
        <Stat label="Desloc." value={`${s.deslocamento}m`} />
        <Stat label="Karma" value={<span className="text-karma">{s.karma}</span>} />
      </div>
    </Panel>
  );
}
