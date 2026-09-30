import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle, Panel, StatBar } from "@/components/game";
import { CombatView } from "@/components/CombatView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/mestre/$id")({
  head: () => ({
    meta: [
      { title: "Mesa do Mestre — Herdeiros RPG" },
      { name: "description", content: "Conduza sua mesa ao vivo." },
      { property: "og:title", content: "Mesa do Mestre — Herdeiros RPG" },
      { property: "og:description", content: "NPCs, jogadores e combate em tempo real." },
    ],
  }),
  component: CampaignPage,
});

type Member = Tables<"campaign_members"> & { sheets: Tables<"sheets"> | null };

function CampaignPage() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const [camp, setCamp] = useState<Tables<"campaigns"> | null>(null);
  const [npcs, setNpcs] = useState<Tables<"npcs_enemies">[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [f, setF] = useState({ name: "", kind: "inimigo", weapon: "", corpo: 1, mente: 1, espirito: 1 });

  const load = useCallback(async () => {
    const [{ data: c }, { data: n }, { data: m }] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", id).maybeSingle(),
      supabase.from("npcs_enemies").select("*").eq("campaign_id", id).order("created_at"),
      supabase.from("campaign_members").select("*, sheets(*)").eq("campaign_id", id),
    ]);
    setCamp(c); setNpcs(n ?? []); setMembers((m as Member[]) ?? []);
  }, [id]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`camp-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "npcs_enemies", filter: `campaign_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_members", filter: `campaign_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "sheets" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load]);

  async function addNpc(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("npcs_enemies").insert({ ...f, campaign_id: id });
    if (error) { toast.error(errMsg(error)); return; }
    setF({ ...f, name: "" }); load();
  }
  async function delNpc(nid: string) {
    const { error } = await supabase.from("npcs_enemies").delete().eq("id", nid);
    if (error) toast.error(errMsg(error)); else load();
  }
  async function healNpc(n: Tables<"npcs_enemies">) {
    const { error } = await supabase.from("npcs_enemies").update({ pv_current: n.pv_max, pf_current: n.pf_max }).eq("id", n.id);
    if (error) toast.error(errMsg(error)); else load();
  }

  if (!camp) return <main className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Carregando…</main>;
  if (camp.master_id !== user.id) return <main className="mx-auto max-w-6xl px-4 py-10">Apenas o Mestre desta mesa pode acessar. <Link to="/mesa" className="text-lilac">Ver como jogador</Link></main>;

  const num = (k: "corpo" | "mente" | "espirito") => (
    <div><Label className="capitalize">{k === "espirito" ? "Espírito" : k}</Label>
      <Input type="number" min={1} max={5} value={f[k]} onChange={(e) => setF({ ...f, [k]: Math.max(1, Math.min(5, Number(e.target.value))) })} /></div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle kicker={`CÓDIGO DA MESA: ${camp.code}`} title={camp.name}>Compartilhe o código com seus jogadores em “Entrar na Mesa”.</PageTitle>
      <Tabs defaultValue="combate">
        <TabsList>
          <TabsTrigger value="combate">Combate</TabsTrigger>
          <TabsTrigger value="npcs">NPCs e Inimigos ({npcs.length})</TabsTrigger>
          <TabsTrigger value="jogadores">Jogadores ({members.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="combate" className="mt-6"><CombatView campaignId={id} isMaster /></TabsContent>
        <TabsContent value="npcs" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Panel className="h-fit">
              <form onSubmit={addNpc} className="space-y-3">
                <div><Label>Nome</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="mt-1 h-9 w-full rounded-md border bg-muted px-2 text-sm">
                    <option value="inimigo">Inimigo</option><option value="npc">NPC</option>
                  </select></div>
                <div><Label>Arma</Label><Input value={f.weapon} onChange={(e) => setF({ ...f, weapon: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-2">{num("corpo")}{num("mente")}{num("espirito")}</div>
                <Button className="w-full">Adicionar</Button>
              </form>
            </Panel>
            <div className="grid gap-4 md:grid-cols-2">
              {npcs.map((n) => (
                <Panel key={n.id}>
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-bold text-lilac">{n.name}</h3><p className="text-xs uppercase text-muted-foreground">{n.kind} · C{n.corpo} M{n.mente} E{n.espirito} · Esq {n.esquiva} · Bloq {n.bloqueio}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => healNpc(n)} aria-label="Restaurar" className="text-muted-foreground hover:text-success"><HeartPulse className="h-4 w-4" /></button>
                      <button onClick={() => delNpc(n.id)} aria-label="Excluir" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <StatBar label="PV" value={n.pv_current ?? 0} max={n.pv_max ?? 0} tone="pv" />
                    <StatBar label="PF" value={n.pf_current ?? 0} max={n.pf_max ?? 0} tone="pf" />
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="jogadores" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {members.length === 0 && <p className="text-muted-foreground">Nenhum jogador entrou ainda.</p>}
            {members.map((m) => (
              <Panel key={m.id}>
                <h3 className="font-bold text-lilac">{m.sheets?.name ?? "Sem ficha vinculada"}</h3>
                {m.sheets && <div className="mt-3 space-y-2">
                  <StatBar label="PV" value={m.sheets.pv_current ?? 0} max={m.sheets.pv_max ?? 0} tone="pv" />
                  <StatBar label="PF" value={m.sheets.pf_current ?? 0} max={m.sheets.pf_max ?? 0} tone="pf" />
                </div>}
              </Panel>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
