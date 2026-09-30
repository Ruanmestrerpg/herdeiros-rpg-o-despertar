import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle, Panel } from "@/components/game";
import { SheetCard } from "@/components/SheetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/jogador")({
  head: () => ({
    meta: [
      { title: "Área do Jogador — Herdeiros RPG" },
      { name: "description", content: "Suas fichas de personagem." },
      { property: "og:title", content: "Área do Jogador — Herdeiros RPG" },
      { property: "og:description", content: "Crie e acompanhe suas fichas." },
    ],
  }),
  component: Jogador,
});

function AttrPicker({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => onChange(n)}
            className={`h-9 flex-1 rounded-md border text-sm font-semibold transition ${value === n ? "border-primary bg-primary text-primary-foreground" : "bg-muted hover:border-primary/50"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Jogador() {
  const { user } = Route.useRouteContext();
  const [sheets, setSheets] = useState<Tables<"sheets">[]>([]);
  const [form, setForm] = useState({ name: "", concept: "", weapon: "", corpo: 1, mente: 1, espirito: 1 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("sheets").select("*").eq("user_id", user.id).order("created_at");
    setSheets(data ?? []);
  }, [user.id]);

  useEffect(() => {
    load();
    const ch = supabase.channel("my-sheets")
      .on("postgres_changes", { event: "*", schema: "public", table: "sheets", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, user.id]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("sheets").insert({ ...form, user_id: user.id });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Ficha criada!");
    setForm({ name: "", concept: "", weapon: "", corpo: 1, mente: 1, espirito: 1 });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta ficha?")) return;
    const { error } = await supabase.from("sheets").delete().eq("id", id);
    if (error) toast.error(errMsg(error)); else load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageTitle kicker="ÁREA DO JOGADOR" title="Suas Fichas">PV, PF e defesas são calculados automaticamente a partir de Corpo e Espírito.</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Panel className="h-fit">
          <h2 className="text-lg font-bold text-gold">Nova ficha</h2>
          <form onSubmit={create} className="mt-4 space-y-3">
            <div><Label>Nome</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Conceito</Label><Input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} /></div>
            <div><Label>Arma / Nomenclatura</Label><Input value={form.weapon} onChange={(e) => setForm({ ...form, weapon: e.target.value })} /></div>
            <AttrPicker label="Corpo" value={form.corpo} onChange={(n) => setForm({ ...form, corpo: n })} />
            <AttrPicker label="Mente" value={form.mente} onChange={(n) => setForm({ ...form, mente: n })} />
            <AttrPicker label="Espírito" value={form.espirito} onChange={(n) => setForm({ ...form, espirito: n })} />
            <Button className="w-full" disabled={busy}>Criar ficha</Button>
          </form>
        </Panel>
        <div className="grid gap-5 md:grid-cols-2">
          {sheets.length === 0 && <p className="text-muted-foreground">Nenhuma ficha ainda. Crie a primeira ao lado.</p>}
          {sheets.map((s) => (
            <SheetCard key={s.id} s={s} actions={
              <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
            } />
          ))}
        </div>
      </div>
    </main>
  );
}
