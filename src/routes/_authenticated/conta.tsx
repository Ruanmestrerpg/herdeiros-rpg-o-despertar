import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel } from "@/components/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta — Herdeiros RPG" },
      { name: "description", content: "Nome de mesa, sessão e histórico." },
      { property: "og:title", content: "Minha Conta — Herdeiros RPG" },
      { property: "og:description", content: "Gerencie sua conta." },
    ],
  }),
  component: Conta,
});

function Conta() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [counts, setCounts] = useState({ sheets: 0, rolls: 0 });

  useEffect(() => {
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => setName(data?.display_name ?? ""));
    Promise.all([
      supabase.from("sheets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("roll_history").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([a, b]) => setCounts({ sheets: a.count ?? 0, rolls: b.count ?? 0 }));
  }, [user.id]);

  async function save() {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name });
    if (error) toast.error(errMsg(error)); else toast.success("Salvo!");
  }
  async function logout() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/login", replace: true });
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <PageTitle kicker="MINHA CONTA" title="Perfil" />
      <Panel className="space-y-4">
        <div><Label>E-mail</Label><p className="mt-1 text-sm">{user.email}</p></div>
        <div><Label>Nome de mesa</Label><div className="mt-1 flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} /><Button onClick={save}>Salvar</Button></div></div>
        <p className="text-sm text-muted-foreground">{counts.sheets} fichas · {counts.rolls} rolagens registradas</p>
        <Button variant="destructive" className="w-full" onClick={logout}>Sair</Button>
      </Panel>
    </main>
  );
}
