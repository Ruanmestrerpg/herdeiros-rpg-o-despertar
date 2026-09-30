import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle, Panel } from "@/components/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/rolador")({
  head: () => ({
    meta: [
      { title: "Rolador Rápido — Herdeiros RPG" },
      { name: "description", content: "Role d4 a d20 e expressões livres com histórico." },
      { property: "og:title", content: "Rolador Rápido — Herdeiros RPG" },
      { property: "og:description", content: "Rolagens com histórico detalhado." },
    ],
  }),
  component: Rolador,
});

type Roll = Tables<"roll_history">;

function Rolador() {
  const { user } = Route.useRouteContext();
  const [expr, setExpr] = useState("");
  const [last, setLast] = useState<Roll | null>(null);
  const [hist, setHist] = useState<Roll[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("roll_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setHist(data ?? []);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function roll(e: string) {
    const { data, error } = await supabase.rpc("record_roll", { p_expression: e });
    if (error) { toast.error(errMsg(error)); return; }
    setLast(data as Roll);
    load();
  }

  const isD20Pool = (r: Roll) => /^\d*d20$/.test(r.expression) && (r.dice as number[]).length > 1;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle kicker="ROLADOR RÁPIDO" title="Invoque os Dados" />
      <Panel>
        <div className="flex flex-wrap gap-2">
          {["d4", "d6", "d8", "d10", "d12", "d20"].map((d) => <Button key={d} variant="secondary" onClick={() => roll(d)}>{d}</Button>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["2d20", "3d20", "4d20", "5d20"].map((d) => <Button key={d} variant="outline" className="border-gold/40 text-gold" onClick={() => roll(d)}>{d}</Button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (expr) roll(expr); }} className="mt-4 flex gap-2">
          <Input placeholder="Ex: 3d8+2" value={expr} onChange={(e) => setExpr(e.target.value)} />
          <Button>Rolar</Button>
        </form>
        {last && (
          <div className="mt-6 rounded-xl border border-primary/40 bg-muted/40 p-5 text-center">
            <p className="text-sm text-muted-foreground">{last.expression}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {(last.dice as number[]).map((d, i) => (
                <span key={i} className="flex h-11 w-11 items-center justify-center rounded-lg border bg-card font-display text-lg">{d}</span>
              ))}
              {last.modifier !== 0 && <span className="self-center text-muted-foreground">{last.modifier > 0 ? "+" : ""}{last.modifier}</span>}
            </div>
            <p className="mt-3 font-display text-4xl text-gold">{last.total}</p>
            {isD20Pool(last) && <p className="text-sm text-lilac">Maior d20 (teste): {Math.max(...(last.dice as number[]))}</p>}
          </div>
        )}
      </Panel>
      <Panel className="mt-6">
        <h2 className="mb-3 font-bold text-gold">Histórico</h2>
        <div className="space-y-1 text-sm">
          {hist.map((r) => (
            <div key={r.id} className="flex justify-between border-b border-border/50 py-1.5">
              <span><b className="text-lilac">{r.expression}</b> <span className="text-muted-foreground">[{(r.dice as number[]).join(", ")}]{r.modifier ? ` ${r.modifier > 0 ? "+" : ""}${r.modifier}` : ""}</span></span>
              <span className="font-display text-gold">{r.total}</span>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
