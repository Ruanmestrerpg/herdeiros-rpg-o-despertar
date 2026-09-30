import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle, Panel } from "@/components/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/mestre/")({
  head: () => ({
    meta: [
      { title: "Área do Mestre — Herdeiros RPG" },
      { name: "description", content: "Crie e conduza suas campanhas." },
      { property: "og:title", content: "Área do Mestre — Herdeiros RPG" },
      { property: "og:description", content: "Campanhas, NPCs e combate ao vivo." },
    ],
  }),
  component: Mestre,
});

function Mestre() {
  const { user } = Route.useRouteContext();
  const [list, setList] = useState<Tables<"campaigns">[]>([]);
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("campaigns").select("*").eq("master_id", user.id).order("created_at", { ascending: false });
    setList(data ?? []);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.rpc("create_campaign", { p_name: name, p_password: pw || undefined });
    if (error) return toast.error(errMsg(error));
    toast.success(`Mesa criada! Código: ${(data as Tables<"campaigns">).code}`);
    setName(""); setPw(""); load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle kicker="ÁREA DO MESTRE" title="Suas Campanhas" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel className="h-fit">
          <h2 className="text-lg font-bold text-gold">Nova campanha</h2>
          <form onSubmit={create} className="mt-4 space-y-3">
            <div><Label>Nome</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Senha (opcional)</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button className="w-full">Criar campanha</Button>
          </form>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {list.length === 0 && <p className="text-muted-foreground">Nenhuma campanha criada.</p>}
          {list.map((c) => (
            <Link key={c.id} to="/mestre/$id" params={{ id: c.id }} className="rounded-xl border bg-card/80 p-5 transition hover:border-primary/50 hover:glow">
              <h3 className="text-xl font-bold text-lilac">{c.name}</h3>
              <p className="mt-2 font-mono text-2xl tracking-[0.3em] text-gold">{c.code}</p>
              {c.has_password && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Com senha</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
