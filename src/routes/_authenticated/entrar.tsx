import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle, Panel } from "@/components/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar na Mesa — Herdeiros RPG" },
      { name: "description", content: "Use o código e a senha da sala do seu Mestre." },
      { property: "og:title", content: "Entrar na Mesa — Herdeiros RPG" },
      { property: "og:description", content: "Junte-se à mesa do seu Mestre." },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const [sheets, setSheets] = useState<Tables<"sheets">[]>([]);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [sheet, setSheet] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("sheets").select("*").eq("user_id", user.id).then(({ data }) => {
      setSheets(data ?? []);
      if (data?.[0]) setSheet(data[0].id);
    });
  }, [user.id]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("join_campaign", { p_code: code, p_password: pw, p_sheet_id: sheet || (null as unknown as string) });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Você entrou na mesa!");
    nav({ to: "/mesa/$id", params: { id: data as string } });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <PageTitle kicker="MESA VIVA" title="Entrar na Mesa" />
      <Panel>
        <form onSubmit={join} className="space-y-4">
          <div><Label>Código da mesa</Label><Input required maxLength={6} className="font-mono text-lg uppercase tracking-[0.3em]" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></div>
          <div><Label>Senha (se houver)</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><Label>Ficha a vincular</Label>
            <select value={sheet} onChange={(e) => setSheet(e.target.value)} className="mt-1 h-9 w-full rounded-md border bg-muted px-2 text-sm">
              <option value="">— sem ficha —</option>
              {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {sheets.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Crie uma ficha na Área do Jogador para participar do combate.</p>}
          </div>
          <Button className="w-full" disabled={busy}>Entrar</Button>
        </form>
      </Panel>
    </main>
  );
}
