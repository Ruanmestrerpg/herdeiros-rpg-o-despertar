# Herdeiros RPG: O Despertar

Crie um aplicativo web completo de RPG de mesa chamado "Herdeiros RPG — O Despertar".
VISUAL E ESTILO:
- Tema dark fantasy, fundo preto/roxo escuro (#0a0a0f)
- Cores principais: roxo/lilás (#a78bfa, #c4b5fd), dourado (#d4a017), acentos de Karma púrpura, PF ouro e PV carmesim
- Tipografia: fontes Cinzel (títulos/serif) e Inter (corpo/UI)
- Cards com bordas sutis e efeito glow roxo
- Interface moderna, limpa e responsiva
- Homepage exatamente com este layout:
  - Navbar: logo "HERDEIROS" + links (Jogador, Mesa, Mestre, Rolador, Regras) + botão "Mestre"
  - Centro: texto pequeno "MESA VIVA", título grande "HERDEIROS RPG", subtítulo dourado "O DESPERTAR"
  - Descrição: "Gerencie fichas, invoque a Voz do Fluxo, conduza combates e mantenha sua mesa conectada em tempo real."
  - Grid de 6 cards:
    1. Área do Jogador — Suas fichas, modo de jogo e simulação de combate
    2. Área do Mestre — Campanhas, mesa ao vivo, NPCs, inimigos e combate
    3. Rolador Rápido — d4 a d20 e expressões livres com histórico detalhado
    4. Regras — Escala de dados, Fluxo, Karma e nomenclaturas
    5. Entrar na Mesa — Use o código e a senha da sala do seu Mestre
    6. Minha Conta — Nome de mesa, sessão e histórico deste aparelho
TECNOLOGIA:
- React + TypeScript + Tailwind CSS integrado ao Lovable Cloud / Supabase (Auth + Postgres + Realtime + RLS)
- Autenticação completa: login/cadastro por e-mail e senha + login com Google
BANCO DE DADOS (criar tabelas com RLS e Supabase Realtime):
- profiles (vinculado a auth.users, trigger handle_new_user)
- sheets (fichas de personagem)
- campaigns (mesas com código único de 6 caracteres e senha opcional)
- campaign_members (jogadores vinculados com suas fichas)
- npcs_enemies (NPCs e inimigos criados pelo mestre)
- combats (sessões de combate ativas/finalizadas, rodada, turno)
- combat_participants (iniciativa, PV/PF atuais, ordem, ativo)
- roll_history (histórico de rolagens)
- events (feed de combate em tempo real)
ATRIBUTOS DERIVADOS DAS FICHAS (trigger automático):
Quando Corpo ou Espírito mudam, calcular:
- Corpo 1: PV Max 25, Esquiva 10, Bloqueio 3, Deslocamento 9m
- Corpo 2: PV Max 32, Esquiva 12, Bloqueio 5, Deslocamento 9m
- Corpo 3: PV Max 42, Esquiva 14, Bloqueio 7, Deslocamento 12m
- Corpo 4: PV Max 52, Esquiva 15, Bloqueio 10, Deslocamento 12m
- Corpo 5: PV Max 60, Esquiva 16, Bloqueio 12, Deslocamento 15m
- PF Max = Espírito × 20
PÁGINAS OBRIGATÓRIAS:
1. /login e /cadastro
   - E-mail + senha
   - Botão "Continuar com Google"
   - Redirecionamento após login
2. /jogador (Área do Jogador)
   - Listar fichas do usuário
   - Criar nova ficha (nome, conceito, Corpo/Mente/Espírito 1-5)
   - Mostrar PV, PF, Esquiva, Bloqueio, Deslocamento com barras de progresso
3. /mestre (Área do Mestre)
   - Criar campanha (nome + senha opcional) → gera código de 6 caracteres
   - Listar campanhas do mestre
   - Ao entrar em uma campanha:
     - Adicionar NPCs/inimigos
     - Botão "Iniciar Combate"
     - Ao iniciar combate:
       • Criar sessão em combats (rodada 1, turno 0)
       • Buscar todos campaign_members com ficha e todos npcs_enemies
       • Criar combat_participants automaticamente
       • Rolar iniciativa (1d20) para cada um
       • Ordenar por iniciativa decrescente
       • Destacar o participante da vez
     - Tela de combate UNIFICADA (não separar "Combate" e "Atacar"):
       • Cabeçalho: RODADA X | VEZ DE: Nome | [Próximo turno] [Encerrar combate]
       • Lista de participantes ordenados por iniciativa, com PV/PF, barras, tipo (PC/NPC)
       • Painel de ataque na mesma tela:
         - Atacante pré-selecionado = participante do turno atual
         - Selecionar alvo
         - Arma ou Nomenclatura
         - Botões: [CORPO] [MENTE] [ESPÍRITO]
         - Valor do atributo (1-5) → rola essa quantidade de d20
         - Usa SOMENTE o maior d20 (não soma)
         - Tipo de defesa: Esquiva ou Bloqueio
         - Dano base
         - Botão "Resolver Ataque"
     - Regras de ataque:
       • Esquiva: se maior d20 >= Esquiva do alvo → acerto e aplica dano total. Senão → erro, dano 0
       • Bloqueio: não tem rolagem de acerto. Dano final = max(0, Dano - Bloqueio)
       • Preservar crítico e dano kármico
     - Feed de combate detalhado mostrando:
       atacante, alvo, arma/nomenclatura, atributo, dados rolados, maior dado, tipo de defesa, resultado, dano bruto/final, PV antes → depois
4. /entrar
   - Campo código da mesa + senha opcional
   - Selecionar ficha para vincular
   - Chamar RPC join_campaign
5. /mesa
   - Listar mesas em que o usuário participa
   - Visualizar combate ativo em tempo real (só leitura)
6. /rolador
   - Botões rápidos d4, d6, d8, d10, d12, d20
   - Botões 2d20, 3d20, 4d20, 5d20
   - Campo de expressão livre (ex: 2d20, 3d8+2)
   - Mostrar resultado com dados individuais + total
   - Histórico das últimas rolagens
7. /regras
   - Tabela de atributos derivados por Corpo
   - Explicação do teste de acerto (maior d20)
   - Regras de Esquiva e Bloqueio
   - Nomenclaturas e armas
8. /conta
   - Dados do usuário logado
   - Botão sair
REGRAS IMPORTANTES DO SISTEMA:
- Toda ação de combate deve ser persistida no banco (não só simulação local)
- Usar Supabase Realtime nas tabelas: sheets, combats, combat_participants, npcs_enemies, campaign_members, roll_history
- Validar tudo no backend (RPCs) — não confiar em dano/iniciativa/PV enviados pelo cliente
- Mestre só gerencia suas próprias campanhas
- Jogadores só veem dados das mesas em que participam
- Ao iniciar combate, NÃO exigir que o mestre adicione participantes manualmente — fazer automático
FLUXO FINAL ESPERADO DO MESTRE:
Abrir mesa → Área de combate → Iniciar combate → Sistema cria tudo automaticamente → Destaca participante atual → Painel de ataque já disponível → Escolhe alvo, arma, atributo → Resolve → Atualiza PV e feed em tempo real → Próximo turno
Crie o banco de dados completo, as políticas RLS, as funções RPC necessárias (join_campaign, start_combat, next_turn, end_combat, perform_attack, combat_apply_damage) e toda a interface funcional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f8729bdf-9692-48ee-8b49-64c85953154b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
