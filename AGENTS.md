<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Game logic (initiative, dice, damage, PV/PF) lives in Postgres SECURITY DEFINER RPCs; client only calls RPCs. Why: server-validated combat, never trust client values.
- Derived stats (PV/PF max, Esquiva, Bloqueio, Deslocamento) computed by DB trigger apply_derived_stats on sheets and npcs_enemies. Why: single source of truth.
