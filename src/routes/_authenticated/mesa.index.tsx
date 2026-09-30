import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle } from "@/components/game";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mesa/")({
  head: () => ({
    meta: [
      { title: "Minhas Mesas — Herdeiros RPG" },
      { name: "description", content: "Mesas em que você participa." },
      { property: "og:title", content: "Minhas Mesas — Herdeiros RPG" },
      { property: "og:description", content: "Acompanhe combates ao vivo." },
    ],
  }),
  component: MesaList,
});

type Row = Tables<"campaign_members"> & { campaigns: Tables<"campaigns"> | null; sheets: Tables<"sheets"> | null };

function MesaList() {
  const { user } = Route.useRouteContext();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase.from("campaign_members").select("*, campaigns(*), sheets(*)").eq("user_id", user.id).then(({ data }) => setRows((data as Row[]) ?? []));
  }, [user.id]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle kicker="MESA" title="Minhas Mesas" />
      {rows.length === 0 && (
        <div className="text-muted-foreground">Você ainda não participa de nenhuma mesa. <Link to="/entrar"><Button size="sm" className="ml-2">Entrar na Mesa</Button></Link></div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((r) => r.campaigns && (
          <Link key={r.id} to="/mesa/$id" params={{ id: r.campaign_id }} className="rounded-xl border bg-card/80 p-5 transition hover:border-primary/50 hover:glow">
            <h3 className="text-xl font-bold text-lilac">{r.campaigns.name}</h3>
            <p className="mt-1 font-mono text-sm tracking-widest text-gold">{r.campaigns.code}</p>
            <p className="mt-2 text-sm text-muted-foreground">Ficha: {r.sheets?.name ?? "—"}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
