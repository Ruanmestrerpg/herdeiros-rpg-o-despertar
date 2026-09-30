
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.apply_derived_stats() returns trigger
language plpgsql set search_path = public as $$
declare old_pv_max int; old_pf_max int;
begin
  if tg_op = 'UPDATE' then old_pv_max := old.pv_max; old_pf_max := old.pf_max; end if;
  new.pv_max := case new.corpo when 1 then 25 when 2 then 32 when 3 then 42 when 4 then 52 else 60 end;
  new.esquiva := case new.corpo when 1 then 10 when 2 then 12 when 3 then 14 when 4 then 15 else 16 end;
  new.bloqueio := case new.corpo when 1 then 3 when 2 then 5 when 3 then 7 when 4 then 10 else 12 end;
  new.deslocamento := case new.corpo when 1 then 9 when 2 then 9 when 3 then 12 when 4 then 12 else 15 end;
  new.pf_max := new.espirito * 20;
  if tg_op = 'INSERT' or new.pv_current is null then new.pv_current := new.pv_max;
  elsif old_pv_max is distinct from new.pv_max then new.pv_current := least(new.pv_current, new.pv_max); end if;
  if tg_op = 'INSERT' or new.pf_current is null then new.pf_current := new.pf_max;
  elsif old_pf_max is distinct from new.pf_max then new.pf_current := least(new.pf_current, new.pf_max); end if;
  new.pv_current := greatest(0, least(new.pv_current, new.pv_max));
  new.pf_current := greatest(0, least(new.pf_current, new.pf_max));
  return new;
end $$;

create table public.sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  concept text,
  weapon text,
  corpo int not null default 1 check (corpo between 1 and 5),
  mente int not null default 1 check (mente between 1 and 5),
  espirito int not null default 1 check (espirito between 1 and 5),
  karma int not null default 0,
  pv_max int, pv_current int, pf_max int, pf_current int,
  esquiva int, bloqueio int, deslocamento int,
  created_at timestamptz not null default now()
);
create trigger sheets_derived before insert or update on public.sheets for each row execute function public.apply_derived_stats();

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null default auth.uid(),
  name text not null,
  code text not null unique,
  has_password boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.campaign_secrets (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  password_hash text
);
create table public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null,
  sheet_id uuid references public.sheets(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique(campaign_id, user_id)
);
create table public.npcs_enemies (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  kind text not null default 'inimigo' check (kind in ('npc','inimigo')),
  weapon text,
  corpo int not null default 1 check (corpo between 1 and 5),
  mente int not null default 1 check (mente between 1 and 5),
  espirito int not null default 1 check (espirito between 1 and 5),
  pv_max int, pv_current int, pf_max int, pf_current int,
  esquiva int, bloqueio int, deslocamento int,
  created_at timestamptz not null default now()
);
create trigger npcs_derived before insert or update on public.npcs_enemies for each row execute function public.apply_derived_stats();

create table public.combats (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  status text not null default 'active' check (status in ('active','ended')),
  round int not null default 1,
  turn_index int not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create table public.combat_participants (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid not null references public.combats(id) on delete cascade,
  sheet_id uuid references public.sheets(id) on delete set null,
  npc_id uuid references public.npcs_enemies(id) on delete set null,
  name text not null,
  kind text not null check (kind in ('pc','npc')),
  weapon text,
  initiative int not null,
  order_index int not null,
  corpo int not null, mente int not null, espirito int not null,
  pv_current int not null, pv_max int not null,
  pf_current int not null, pf_max int not null,
  esquiva int not null, bloqueio int not null,
  active boolean not null default true
);
create table public.roll_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  expression text not null,
  dice jsonb not null,
  modifier int not null default 0,
  total int not null,
  created_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  combat_id uuid references public.combats(id) on delete cascade,
  type text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_campaign_master(_cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from campaigns where id = _cid and master_id = auth.uid()) $$;
create or replace function public.is_campaign_member(_cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from campaign_members where campaign_id = _cid and user_id = auth.uid())
      or exists(select 1 from campaigns where id = _cid and master_id = auth.uid()) $$;
create or replace function public.can_view_sheet(_sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from sheets where id = _sid and user_id = auth.uid())
      or exists(select 1 from campaign_members m where m.sheet_id = _sid and public.is_campaign_member(m.campaign_id)) $$;

grant select, insert, update, delete on public.sheets to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, delete on public.campaign_members to authenticated;
grant select, insert, update, delete on public.npcs_enemies to authenticated;
grant select on public.combats, public.combat_participants, public.events to authenticated;
grant select, insert, delete on public.roll_history to authenticated;
grant all on public.sheets, public.campaigns, public.campaign_secrets, public.campaign_members, public.npcs_enemies, public.combats, public.combat_participants, public.roll_history, public.events to service_role;

alter table public.sheets enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_secrets enable row level security;
alter table public.campaign_members enable row level security;
alter table public.npcs_enemies enable row level security;
alter table public.combats enable row level security;
alter table public.combat_participants enable row level security;
alter table public.roll_history enable row level security;
alter table public.events enable row level security;

create policy "sheets view" on public.sheets for select to authenticated using (public.can_view_sheet(id));
create policy "sheets insert" on public.sheets for insert to authenticated with check (user_id = auth.uid());
create policy "sheets update" on public.sheets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sheets delete" on public.sheets for delete to authenticated using (user_id = auth.uid());

create policy "campaigns view" on public.campaigns for select to authenticated using (public.is_campaign_member(id));
create policy "campaigns master update" on public.campaigns for update to authenticated using (master_id = auth.uid());
create policy "campaigns master delete" on public.campaigns for delete to authenticated using (master_id = auth.uid());

create policy "members view" on public.campaign_members for select to authenticated using (public.is_campaign_member(campaign_id));
create policy "members leave or kick" on public.campaign_members for delete to authenticated using (user_id = auth.uid() or public.is_campaign_master(campaign_id));

create policy "npcs view" on public.npcs_enemies for select to authenticated using (public.is_campaign_member(campaign_id));
create policy "npcs master insert" on public.npcs_enemies for insert to authenticated with check (public.is_campaign_master(campaign_id));
create policy "npcs master update" on public.npcs_enemies for update to authenticated using (public.is_campaign_master(campaign_id));
create policy "npcs master delete" on public.npcs_enemies for delete to authenticated using (public.is_campaign_master(campaign_id));

create policy "combats view" on public.combats for select to authenticated using (public.is_campaign_member(campaign_id));
create policy "participants view" on public.combat_participants for select to authenticated
  using (exists(select 1 from public.combats c where c.id = combat_id and public.is_campaign_member(c.campaign_id)));
create policy "events view" on public.events for select to authenticated using (public.is_campaign_member(campaign_id));

create policy "rolls own view" on public.roll_history for select to authenticated using (user_id = auth.uid());
create policy "rolls own delete" on public.roll_history for delete to authenticated using (user_id = auth.uid());

create or replace function public.create_campaign(p_name text, p_password text default null)
returns public.campaigns language plpgsql security definer set search_path = public, extensions as $$
declare v_code text; v_row campaigns; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'Nome obrigatório'; end if;
  loop
    v_code := '';
    for i in 1..6 loop v_code := v_code || substr(chars, 1 + floor(random()*length(chars))::int, 1); end loop;
    exit when not exists(select 1 from campaigns where code = v_code);
  end loop;
  insert into campaigns(master_id, name, code, has_password)
  values (auth.uid(), trim(p_name), v_code, coalesce(p_password,'') <> '') returning * into v_row;
  insert into campaign_secrets(campaign_id, password_hash)
  values (v_row.id, case when coalesce(p_password,'') <> '' then crypt(p_password, gen_salt('bf')) end);
  return v_row;
end $$;

create or replace function public.join_campaign(p_code text, p_password text, p_sheet_id uuid)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_c campaigns; v_hash text;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  select * into v_c from campaigns where code = upper(trim(p_code));
  if not found then raise exception 'Mesa não encontrada'; end if;
  select password_hash into v_hash from campaign_secrets where campaign_id = v_c.id;
  if v_hash is not null and (p_password is null or crypt(p_password, v_hash) <> v_hash) then
    raise exception 'Senha incorreta'; end if;
  if p_sheet_id is not null and not exists(select 1 from sheets where id = p_sheet_id and user_id = auth.uid()) then
    raise exception 'Ficha inválida'; end if;
  insert into campaign_members(campaign_id, user_id, sheet_id) values (v_c.id, auth.uid(), p_sheet_id)
  on conflict (campaign_id, user_id) do update set sheet_id = excluded.sheet_id;
  return v_c.id;
end $$;

create or replace function public.start_combat(p_campaign_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; r record; i int := 0; v_count int;
begin
  if not is_campaign_master(p_campaign_id) then raise exception 'Apenas o Mestre'; end if;
  update combats set status = 'ended', ended_at = now() where campaign_id = p_campaign_id and status = 'active';
  insert into combats(campaign_id) values (p_campaign_id) returning id into v_id;

  insert into combat_participants(combat_id, sheet_id, name, kind, weapon, initiative, order_index, corpo, mente, espirito, pv_current, pv_max, pf_current, pf_max, esquiva, bloqueio, active)
  select v_id, s.id, s.name, 'pc', s.weapon, 1 + floor(random()*20)::int, 0, s.corpo, s.mente, s.espirito, s.pv_current, s.pv_max, s.pf_current, s.pf_max, s.esquiva, s.bloqueio, s.pv_current > 0
  from campaign_members m join sheets s on s.id = m.sheet_id where m.campaign_id = p_campaign_id;

  insert into combat_participants(combat_id, npc_id, name, kind, weapon, initiative, order_index, corpo, mente, espirito, pv_current, pv_max, pf_current, pf_max, esquiva, bloqueio, active)
  select v_id, n.id, n.name, 'npc', n.weapon, 1 + floor(random()*20)::int, 0, n.corpo, n.mente, n.espirito, n.pv_current, n.pv_max, n.pf_current, n.pf_max, n.esquiva, n.bloqueio, n.pv_current > 0
  from npcs_enemies n where n.campaign_id = p_campaign_id;

  select count(*) into v_count from combat_participants where combat_id = v_id;
  if v_count = 0 then raise exception 'Nenhum participante (vincule fichas ou crie NPCs)'; end if;

  for r in select id from combat_participants where combat_id = v_id order by initiative desc, random() loop
    update combat_participants set order_index = i where id = r.id; i := i + 1;
  end loop;

  update combats set turn_index = coalesce((select min(order_index) from combat_participants where combat_id = v_id and active), 0) where id = v_id;

  insert into events(campaign_id, combat_id, type, message, data)
  values (p_campaign_id, v_id, 'start', 'Combate iniciado — Rodada 1',
    (select jsonb_build_object('order', jsonb_agg(jsonb_build_object('name', name, 'initiative', initiative) order by order_index)) from combat_participants where combat_id = v_id));
  return v_id;
end $$;

create or replace function public.next_turn(p_combat_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_c combats; v_next int; v_name text; v_round int;
begin
  select * into v_c from combats where id = p_combat_id;
  if not found or not is_campaign_master(v_c.campaign_id) then raise exception 'Apenas o Mestre'; end if;
  if v_c.status <> 'active' then raise exception 'Combate encerrado'; end if;
  v_round := v_c.round;
  select min(order_index) into v_next from combat_participants where combat_id = p_combat_id and active and order_index > v_c.turn_index;
  if v_next is null then
    select min(order_index) into v_next from combat_participants where combat_id = p_combat_id and active;
    v_round := v_round + 1;
  end if;
  if v_next is null then raise exception 'Nenhum participante ativo'; end if;
  update combats set turn_index = v_next, round = v_round where id = p_combat_id;
  select name into v_name from combat_participants where combat_id = p_combat_id and order_index = v_next;
  insert into events(campaign_id, combat_id, type, message, data)
  values (v_c.campaign_id, p_combat_id, 'turn', 'Rodada ' || v_round || ' — vez de ' || v_name, jsonb_build_object('round', v_round, 'name', v_name));
end $$;

create or replace function public.end_combat(p_combat_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_c combats;
begin
  select * into v_c from combats where id = p_combat_id;
  if not found or not is_campaign_master(v_c.campaign_id) then raise exception 'Apenas o Mestre'; end if;
  update combats set status = 'ended', ended_at = now() where id = p_combat_id;
  insert into events(campaign_id, combat_id, type, message) values (v_c.campaign_id, p_combat_id, 'end', 'Combate encerrado');
end $$;

create or replace function public._apply_damage(p_participant uuid, p_amount int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p combat_participants; v_before int; v_after int;
begin
  select * into p from combat_participants where id = p_participant for update;
  v_before := p.pv_current;
  v_after := greatest(0, least(p.pv_max, p.pv_current - p_amount));
  update combat_participants set pv_current = v_after, active = v_after > 0 where id = p_participant;
  if p.sheet_id is not null then update sheets set pv_current = v_after where id = p.sheet_id; end if;
  if p.npc_id is not null then update npcs_enemies set pv_current = v_after where id = p.npc_id; end if;
  return jsonb_build_object('before', v_before, 'after', v_after);
end $$;
revoke all on function public._apply_damage(uuid, int) from public, anon, authenticated;

create or replace function public.combat_apply_damage(p_participant_id uuid, p_amount int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cid uuid; v_comb uuid; v_name text; v_res jsonb;
begin
  select c.campaign_id, c.id, p.name into v_cid, v_comb, v_name from combat_participants p join combats c on c.id = p.combat_id where p.id = p_participant_id;
  if v_cid is null or not is_campaign_master(v_cid) then raise exception 'Apenas o Mestre'; end if;
  if p_amount < -200 or p_amount > 200 then raise exception 'Valor inválido'; end if;
  v_res := _apply_damage(p_participant_id, p_amount);
  insert into events(campaign_id, combat_id, type, message, data)
  values (v_cid, v_comb, case when p_amount >= 0 then 'damage' else 'heal' end,
    v_name || case when p_amount >= 0 then ' sofre ' || p_amount || ' de dano' else ' recupera ' || (-p_amount) || ' PV' end
      || ' (PV ' || (v_res->>'before') || ' → ' || (v_res->>'after') || ')', v_res);
  return v_res;
end $$;

create or replace function public.perform_attack(p_combat_id uuid, p_target_id uuid, p_attribute text, p_defense text, p_base_damage int, p_weapon text default null, p_karmic boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_c combats; a combat_participants; t combat_participants; v_attr int; v_dice int[] := '{}'; v_max int := 0; i int; d int;
  v_hit boolean; v_crit boolean; v_raw int; v_final int; v_res jsonb; v_data jsonb; v_msg text;
begin
  select * into v_c from combats where id = p_combat_id;
  if not found or not is_campaign_master(v_c.campaign_id) then raise exception 'Apenas o Mestre'; end if;
  if v_c.status <> 'active' then raise exception 'Combate encerrado'; end if;
  if p_attribute not in ('corpo','mente','espirito') then raise exception 'Atributo inválido'; end if;
  if p_defense not in ('esquiva','bloqueio') then raise exception 'Defesa inválida'; end if;
  if p_base_damage is null or p_base_damage < 0 or p_base_damage > 100 then raise exception 'Dano base inválido (0-100)'; end if;
  select * into a from combat_participants where combat_id = p_combat_id and order_index = v_c.turn_index;
  select * into t from combat_participants where id = p_target_id and combat_id = p_combat_id;
  if t.id is null then raise exception 'Alvo inválido'; end if;
  if not a.active then raise exception 'Atacante fora de combate'; end if;
  if p_karmic then
    if a.pf_current < 5 then raise exception 'PF insuficiente para dano kármico (5 PF)'; end if;
    update combat_participants set pf_current = pf_current - 5 where id = a.id;
    if a.sheet_id is not null then update sheets set pf_current = pf_current - 5, karma = karma + 1 where id = a.sheet_id; end if;
    if a.npc_id is not null then update npcs_enemies set pf_current = pf_current - 5 where id = a.npc_id; end if;
  end if;
  v_attr := case p_attribute when 'corpo' then a.corpo when 'mente' then a.mente else a.espirito end;
  for i in 1..v_attr loop d := 1 + floor(random()*20)::int; v_dice := v_dice || d; v_max := greatest(v_max, d); end loop;
  v_crit := v_max = 20;
  v_raw := p_base_damage * case when v_crit then 2 else 1 end;
  if p_defense = 'esquiva' then
    v_hit := v_crit or v_max >= t.esquiva;
    v_final := case when v_hit then v_raw else 0 end;
  else
    v_hit := true;
    v_final := case when p_karmic then v_raw else greatest(0, v_raw - t.bloqueio) end;
  end if;
  v_res := _apply_damage(t.id, v_final);
  v_msg := a.name || ' ataca ' || t.name || coalesce(' com ' || nullif(p_weapon,''), '') || ' — ' ||
    case when not v_hit then 'ERROU' when v_crit then 'CRÍTICO! ' || v_final || ' de dano' else v_final || ' de dano' end;
  v_data := jsonb_build_object('attacker', a.name, 'target', t.name, 'weapon', p_weapon, 'attribute', p_attribute, 'attr_value', v_attr,
    'dice', to_jsonb(v_dice), 'highest', v_max, 'defense', p_defense, 'defense_value', case when p_defense='esquiva' then t.esquiva else t.bloqueio end,
    'hit', v_hit, 'crit', v_crit, 'karmic', p_karmic, 'raw_damage', v_raw, 'final_damage', v_final,
    'pv_before', v_res->'before', 'pv_after', v_res->'after');
  insert into events(campaign_id, combat_id, type, message, data) values (v_c.campaign_id, p_combat_id, 'attack', v_msg, v_data);
  return v_data;
end $$;

create or replace function public.record_roll(p_expression text)
returns public.roll_history language plpgsql security definer set search_path = public as $$
declare v_expr text := lower(replace(coalesce(p_expression,''),' ','')); m text[]; n int; s int; mod int; v_dice int[] := '{}'; tot int := 0; i int; d int; r roll_history;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  m := regexp_match(v_expr, '^(\d*)d(\d+)([+-]\d+)?$');
  if m is null then raise exception 'Expressão inválida (ex: 2d20, 3d8+2)'; end if;
  n := coalesce(nullif(m[1],'')::int, 1); s := m[2]::int; mod := coalesce(m[3]::int, 0);
  if n < 1 or n > 50 or s < 2 or s > 1000 or abs(mod) > 1000 then raise exception 'Valores fora do limite'; end if;
  for i in 1..n loop d := 1 + floor(random()*s)::int; v_dice := v_dice || d; tot := tot + d; end loop;
  insert into roll_history(user_id, expression, dice, modifier, total) values (auth.uid(), v_expr, to_jsonb(v_dice), mod, tot + mod) returning * into r;
  return r;
end $$;

grant execute on function public.create_campaign(text,text), public.join_campaign(text,text,uuid), public.start_combat(uuid), public.next_turn(uuid), public.end_combat(uuid), public.combat_apply_damage(uuid,int), public.perform_attack(uuid,uuid,text,text,int,text,boolean), public.record_roll(text) to authenticated;

alter table public.sheets replica identity full;
alter table public.combat_participants replica identity full;
alter publication supabase_realtime add table public.sheets, public.combats, public.combat_participants, public.npcs_enemies, public.campaign_members, public.roll_history, public.events;
