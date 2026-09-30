import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageTitle } from "@/components/game";
import { CombatView } from "@/components/CombatView";

export const Route = createFileRoute("/_authenticated/mesa/$id")({
  head: () => ({
    meta: [
      { title: "Mesa ao Vivo — Herdeiros RPG" },
      { name: "description", content: "Acompanhe o combate da sua mesa em tempo real." },
      { property: "og:title", content: "Mesa ao Vivo — Herdeiros RPG" },
      { property: "og:description", content: "Combate em tempo real." },
    ],
  }),
  component: MesaLive,
});

function MesaLive() {
  const { id } = Route.useParams();
  const [camp, setCamp] = useState<Tables<"campaigns"> | null>(null);
  useEffect(() => { supabase.from("campaigns").select("*").eq("id", id).maybeSingle().then(({ data }) => setCamp(data)); }, [id]);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle kicker="MESA AO VIVO" title={camp?.name ?? "Mesa"}>Visualização em tempo real (somente leitura).</PageTitle>
      <CombatView campaignId={id} isMaster={false} />
    </main>
  );
}
