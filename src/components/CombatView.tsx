import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Swords, SkipForward, Square, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Panel, StatBar } from "@/components/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errMsg } from "@/lib/auth";
import { ATTR_LABEL } from "@/lib/rules";
import { cn } from "@/lib/utils";

type Combat = Tables<"combats">;
type Part = Tables<"combat_participants">;
type Ev = Tables<"events">;

export function CombatView({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [combat, setCombat] = useState<Combat | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [busy, setBusy] = useState(false);

  const loadCombat = useCallback(async () => {
    const { data } = await supabase.from("combats").select("*").eq("campaign_id", campaignId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setCombat(data);
    if (data) {
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from("combat_participants").select("*").eq("combat_id", data.id).order("order_index"),
        supabase.from("events").select("*").eq("combat_id", data.id).order("created_at", { ascending: false }).limit(50),
      ]);
      setParts(p ?? []);
      setEvents(e ?? []);
    } else {
      setParts([]);
      setEvents([]);
    }
  }, [campaignId]);

  useEffect(() => {
    loadCombat();
    const ch = supabase.channel(`combat-${campaignId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "combats", filter: `campaign_id=eq.${campaignId}` }, loadCombat)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events", filter: `campaign_id=eq.${campaignId}` }, loadCombat)
      .on("postgres_changes", { event: "*", schema: "public", table: "combat_participants" }, loadCombat)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaignId, loadCombat]);

  async function rpc(fn: () => PromiseLike<{ error: unknown }>, ok?: string) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) toast.error(errMsg(error));
    else { if (ok) toast.success(ok); loadCombat(); }
  }

  const current = parts.find((p) => combat && p.order_index === combat.turn_index);

  if (!combat) {
    return (
      <Panel className="text-center">
        <Swords className="mx-auto h-10 w-10 text-lilac" />
        <p className="mt-3 text-muted-foreground">Nenhum combate ativo.</p>
        {isMaster && (
          <Button className="mt-4" disabled={busy} onClick={() => rpc(() => supabase.rpc("start_combat", { p_campaign_id: campaignId }), "Combate iniciado!")}>
            Iniciar Combate
          </Button>
        )}
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <Panel className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="font-display text-lg tracking-wider">
          <span className="text-gold">RODADA {combat.round}</span>
          <span className="mx-3 text-muted-foreground">|</span>
          <span className="text-muted-foreground">VEZ DE: </span>
          <span className="text-lilac">{current?.name ?? "—"}</span>
        </div>
        {isMaster && (
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => rpc(() => supabase.rpc("next_turn", { p_combat_id: combat.id }))}><SkipForward className="mr-1 h-4 w-4" />Próximo turno</Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => confirm("Encerrar combate?") && rpc(() => supabase.rpc("end_combat", { p_combat_id: combat.id }), "Combate encerrado")}><Square className="mr-1 h-4 w-4" />Encerrar combate</Button>
          </div>
        )}
      </Panel>

      <div className={cn("grid gap-5", isMaster && "lg:grid-cols-[1fr_380px]")}>
        <div className="space-y-3">
          {parts.map((p) => {
            const isTurn = p.id === current?.id;
            return (
              <div key={p.id} className={cn("rounded-xl border bg-card/80 p-4 transition", isTurn && "border-gold glow ring-1 ring-gold/60", !p.active && "opacity-40")}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-display text-sm text-gold">{p.initiative}</span>
                    <span className="font-semibold">{p.name}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", p.kind === "pc" ? "bg-primary/20 text-lilac" : "bg-pv/20 text-pv")}>{p.kind === "pc" ? "PC" : "NPC"}</span>
                    {!p.active && <span className="text-xs text-pv">caído</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">Esq {p.esquiva} · Bloq {p.bloqueio}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <StatBar label="PV" value={p.pv_current} max={p.pv_max} tone="pv" />
                  <StatBar label="PF" value={p.pf_current} max={p.pf_max} tone="pf" />
                </div>
              </div>
            );
          })}
        </div>
        {isMaster && current && <AttackPanel combat={combat} attacker={current} parts={parts} onDone={loadCombat} />}
      </div>

      <Panel>
        <h3 className="mb-3 text-lg font-bold text-gold">Feed de combate</h3>
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {events.map((e) => <EventRow key={e.id} e={e} />)}
        </div>
      </Panel>
    </div>
  );
}

function EventRow({ e }: { e: Ev }) {
  const d = e.data as { dice?: number[]; hit?: boolean; crit?: boolean; karmic?: boolean; attacker?: string; target?: string; weapon?: string; attribute?: string; attr_value?: number; highest?: number; defense?: string; defense_value?: number; raw_damage?: number; final_damage?: number; pv_before?: number; pv_after?: number };
  if (e.type !== "attack") {
    return <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{e.message}</div>;
  }
  const dice = (d.dice as number[]) ?? [];
  const hit = d.hit as boolean;
  return (
    <div className={cn("rounded-md border-l-4 bg-muted/40 px-3 py-2 text-sm", !hit ? "border-muted-foreground" : d.crit ? "border-gold" : "border-pv")}>
      <div className="font-semibold">{e.message}</div>
      <div className="mt-1 grid gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2">
        <span>Atacante: <b className="text-foreground">{String(d.attacker)}</b> → Alvo: <b className="text-foreground">{String(d.target)}</b></span>
        <span>Arma/Nomenclatura: {String(d.weapon || "—")}</span>
        <span>Atributo: {ATTR_LABEL[String(d.attribute)]} ({String(d.attr_value)}d20)</span>
        <span>Dados: [{dice.map((x, i) => <b key={i} className={x === d.highest ? "text-gold" : ""}>{x}{i < dice.length - 1 ? ", " : ""}</b>)}] · Maior: <b className="text-gold">{String(d.highest)}</b></span>
        <span>Defesa: {d.defense === "esquiva" ? "Esquiva" : "Bloqueio"} ({String(d.defense_value)}) · {hit ? "ACERTO" : "ERRO"}{d.crit ? " · CRÍTICO" : ""}{d.karmic ? " · KÁRMICO" : ""}</span>
        <span>Dano bruto {String(d.raw_damage)} → final <b className="text-pv">{String(d.final_damage)}</b> · PV {String(d.pv_before)} → {String(d.pv_after)}</span>
      </div>
    </div>
  );
}

function AttackPanel({ combat, attacker, parts, onDone }: { combat: Combat; attacker: Part; parts: Part[]; onDone: () => void }) {
  const targets = useMemo(() => parts.filter((p) => p.id !== attacker.id && p.active), [parts, attacker.id]);
  const [target, setTarget] = useState("");
  const [weapon, setWeapon] = useState(attacker.weapon ?? "");
  const [attr, setAttr] = useState<"corpo" | "mente" | "espirito">("corpo");
  const [defense, setDefense] = useState<"esquiva" | "bloqueio">("esquiva");
  const [dmg, setDmg] = useState(8);
  const [karmic, setKarmic] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setWeapon(attacker.weapon ?? ""); setKarmic(false); }, [attacker.id, attacker.weapon]);
  useEffect(() => { if (!targets.find((t) => t.id === target)) setTarget(targets[0]?.id ?? ""); }, [targets, target]);

  const attrVal = attacker[attr];

  async function resolve() {
    if (!target) { toast.error("Escolha um alvo"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("perform_attack", {
      p_combat_id: combat.id, p_target_id: target, p_attribute: attr, p_defense: defense, p_base_damage: dmg, p_weapon: weapon, p_karmic: karmic,
    });
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    const r = data as { hit: boolean; final_damage: number; highest: number; crit: boolean };
    toast[r.hit ? "success" : "info"](r.hit ? `${r.crit ? "CRÍTICO! " : ""}${r.final_damage} de dano (maior d20: ${r.highest})` : `Errou! (maior d20: ${r.highest})`);
    onDone();
  }

  return (
    <Panel className="h-fit space-y-4 lg:sticky lg:top-20">
      <h3 className="text-lg font-bold text-gold">Painel de ataque</h3>
      <div><Label>Atacante</Label><div className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm text-lilac">{attacker.name}</div></div>
      <div>
        <Label>Alvo</Label>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 h-9 w-full rounded-md border bg-muted px-2 text-sm">
          {targets.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.kind.toUpperCase()}) — PV {t.pv_current}</option>)}
        </select>
      </div>
      <div><Label>Arma ou Nomenclatura</Label><Input value={weapon} onChange={(e) => setWeapon(e.target.value)} placeholder="Ex: Lâmina Rúnica" /></div>
      <div>
        <Label>Atributo</Label>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["corpo", "mente", "espirito"] as const).map((a) => (
            <button key={a} onClick={() => setAttr(a)} className={cn("rounded-md border py-2 text-xs font-bold tracking-wider", attr === a ? "border-primary bg-primary text-primary-foreground" : "bg-muted")}>
              {ATTR_LABEL[a].toUpperCase()}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Valor {attrVal} → rola {attrVal}d20, usa só o maior.</p>
      </div>
      <div>
        <Label>Defesa do alvo</Label>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {(["esquiva", "bloqueio"] as const).map((d) => (
            <button key={d} onClick={() => setDefense(d)} className={cn("rounded-md border py-2 text-xs font-bold", defense === d ? "border-gold bg-gold/20 text-gold" : "bg-muted")}>
              {d === "esquiva" ? "ESQUIVA" : "BLOQUEIO"}
            </button>
          ))}
        </div>
      </div>
      <div><Label>Dano base</Label><Input type="number" min={0} max={100} value={dmg} onChange={(e) => setDmg(Number(e.target.value))} /></div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={karmic} onChange={(e) => setKarmic(e.target.checked)} />
        <Flame className="h-4 w-4 text-karma" /> Dano kármico (−5 PF, ignora Bloqueio)
      </label>
      <Button className="w-full" disabled={busy || !target} onClick={resolve}>Resolver Ataque</Button>
    </Panel>
  );
}
