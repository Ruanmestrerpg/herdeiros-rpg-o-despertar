import { createFileRoute, Link } from "@tanstack/react-router";
import { Swords, Crown, Dices, ScrollText, DoorOpen, UserCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Herdeiros RPG — O Despertar" },
      { name: "description", content: "Gerencie fichas, invoque a Voz do Fluxo, conduza combates e mantenha sua mesa conectada em tempo real." },
      { property: "og:title", content: "Herdeiros RPG — O Despertar" },
      { property: "og:description", content: "Mesa viva de RPG com fichas, combate e rolagens em tempo real." },
    ],
  }),
  component: Index,
});

const cards = [
  { to: "/jogador", icon: Swords, title: "Área do Jogador", desc: "Suas fichas, modo de jogo e simulação de combate" },
  { to: "/mestre", icon: Crown, title: "Área do Mestre", desc: "Campanhas, mesa ao vivo, NPCs, inimigos e combate" },
  { to: "/rolador", icon: Dices, title: "Rolador Rápido", desc: "d4 a d20 e expressões livres com histórico detalhado" },
  { to: "/regras", icon: ScrollText, title: "Regras", desc: "Escala de dados, Fluxo, Karma e nomenclaturas" },
  { to: "/entrar", icon: DoorOpen, title: "Entrar na Mesa", desc: "Use o código e a senha da sala do seu Mestre" },
  { to: "/conta", icon: UserCircle, title: "Minha Conta", desc: "Nome de mesa, sessão e histórico deste aparelho" },
] as const;

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <section className="text-center">
        <p className="text-xs font-semibold tracking-[0.5em] text-lilac/70">MESA VIVA</p>
        <h1 className="mt-4 text-5xl font-black tracking-wider text-lilac drop-shadow-[0_0_25px_oklch(0.72_0.14_293/0.5)] md:text-7xl">HERDEIROS RPG</h1>
        <p className="mt-3 font-display text-xl tracking-[0.4em] text-gold md:text-2xl">O DESPERTAR</p>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          Gerencie fichas, invoque a Voz do Fluxo, conduza combates e mantenha sua mesa conectada em tempo real.
        </p>
      </section>
      <section className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-xl border bg-card/70 p-6 transition hover:-translate-y-1 hover:border-primary/50 hover:glow">
            <c.icon className="h-8 w-8 text-lilac transition group-hover:text-gold" />
            <h2 className="mt-4 text-lg font-bold text-foreground">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
