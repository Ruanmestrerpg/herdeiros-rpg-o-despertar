import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/game";
import { CORPO_TABLE } from "@/lib/rules";

export const Route = createFileRoute("/regras")({
  head: () => ({
    meta: [
      { title: "Regras — Herdeiros RPG" },
      { name: "description", content: "Escala de dados, Fluxo, Karma, Esquiva, Bloqueio e nomenclaturas." },
      { property: "og:title", content: "Regras — Herdeiros RPG" },
      { property: "og:description", content: "Tudo que você precisa saber para jogar." },
    ],
  }),
  component: Regras,
});

function Regras() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <PageTitle kicker="REGRAS" title="O Códex do Despertar" />
      <Panel>
        <h2 className="text-xl font-bold text-gold">Atributos derivados por Corpo</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Corpo</th><th>PV Máx</th><th>Esquiva</th><th>Bloqueio</th><th>Deslocamento</th></tr></thead>
            <tbody>
              {CORPO_TABLE.map((r) => (
                <tr key={r.corpo} className="border-t border-border/50"><td className="py-2 font-display text-lilac">{r.corpo}</td><td className="text-pv">{r.pv}</td><td>{r.esquiva}</td><td>{r.bloqueio}</td><td>{r.desloc}m</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground"><b className="text-pf">PF Máx</b> (Pontos de Fluxo) = Espírito × 20.</p>
      </Panel>
      <Panel>
        <h2 className="text-xl font-bold text-gold">Teste de acerto — o maior d20</h2>
        <p className="mt-2 text-muted-foreground">Escolha o atributo da ação (Corpo, Mente ou Espírito). Role uma quantidade de d20 igual ao valor do atributo (1 a 5) e use <b className="text-foreground">somente o maior resultado</b> — os dados não são somados. Um 20 natural é um <b className="text-gold">crítico</b>: acerta automaticamente e dobra o dano base.</p>
      </Panel>
      <Panel>
        <h2 className="text-xl font-bold text-gold">Esquiva e Bloqueio</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
          <li><b className="text-foreground">Esquiva:</b> se o maior d20 for maior ou igual à Esquiva do alvo, o ataque acerta e causa o dano total. Caso contrário, erra (dano 0).</li>
          <li><b className="text-foreground">Bloqueio:</b> não há rolagem de acerto. Dano final = Dano − Bloqueio (mínimo 0).</li>
          <li><b className="text-karma">Dano kármico:</b> consome 5 PF do atacante, acumula Karma e ignora o Bloqueio.</li>
        </ul>
      </Panel>
      <Panel>
        <h2 className="text-xl font-bold text-gold">Fluxo, Karma, Nomenclaturas e Armas</h2>
        <p className="mt-2 text-muted-foreground">O <b className="text-pf">Fluxo</b> é a energia espiritual do Herdeiro, medida em PF. O <b className="text-karma">Karma</b> registra o peso das escolhas — cresce ao usar poder kármico. <b className="text-foreground">Nomenclaturas</b> são técnicas nomeadas pela Voz do Fluxo; tanto elas quanto as <b className="text-foreground">armas</b> definem o dano base informado pelo Mestre no painel de ataque.</p>
      </Panel>
    </main>
  );
}
