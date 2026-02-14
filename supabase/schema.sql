create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'user' check (role in ('user', 'admin')),
  provider text not null,
  provider_account_id text not null,
  email text not null,
  name text,
  image_url text,
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

alter table if exists public.users
  add column if not exists role text not null default 'user';

update public.users
set role = 'user'
where role is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('user', 'admin'));
  end if;
end $$;

create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  diamonds integer not null default 0 check (diamonds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.creatures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_file_id text,
  image_url text,
  tribe text not null check (tribe in ('overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient')),
  power integer not null default 0 check (power >= 0),
  courage integer not null default 0 check (courage >= 0),
  speed integer not null default 0 check (speed >= 0),
  wisdom integer not null default 0 check (wisdom >= 0),
  mugic integer not null default 0 check (mugic >= 0),
  energy integer not null default 0 check (energy >= 0),
  dominant_elements text[] not null default '{}'::text[],
  support_ability_id uuid,
  brainwashed_ability_id uuid,
  equipment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.abilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('support', 'brainwashed')),
  effect_type text not null check (effect_type in ('increase', 'decrease')),
  target_scope text not null check (target_scope in ('all_creatures', 'same_tribe', 'enemy_only')),
  stat text not null check (stat in ('power', 'courage', 'speed', 'wisdom', 'energy')),
  value integer not null check (value >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_file_id text,
  image_url text,
  initiative_elements text[] not null default '{}'::text[],
  tribes text[] not null default '{}'::text[],
  abilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.battlegear (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_file_id text,
  image_url text,
  allowed_tribes text[] not null default '{}'::text[],
  allowed_creature_ids uuid[] not null default '{}'::uuid[],
  abilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mugic (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_file_id text,
  image_url text,
  tribes text[] not null default '{}'::text[],
  cost integer not null default 0 check (cost >= 0),
  abilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.abilities
  add column if not exists target_scope text not null default 'all_creatures';

update public.abilities
set target_scope = 'all_creatures'
where target_scope is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'abilities_target_scope_check'
  ) then
    alter table public.abilities
      add constraint abilities_target_scope_check
      check (target_scope in ('all_creatures', 'same_tribe', 'enemy_only'));
  end if;
end $$;

alter table if exists public.creatures
  add column if not exists support_ability_id uuid;

alter table if exists public.creatures
  add column if not exists brainwashed_ability_id uuid;

alter table if exists public.creatures
  add column if not exists image_url text;

alter table if exists public.creatures
  add column if not exists image_file_id text;

alter table if exists public.locations
  add column if not exists image_file_id text;

alter table if exists public.locations
  add column if not exists image_url text;

alter table if exists public.locations
  add column if not exists initiative_elements text[] not null default '{}'::text[];

alter table if exists public.locations
  add column if not exists tribes text[] not null default '{}'::text[];

alter table if exists public.locations
  add column if not exists abilities jsonb not null default '[]'::jsonb;

alter table if exists public.battlegear
  add column if not exists image_file_id text;

alter table if exists public.battlegear
  add column if not exists image_url text;

alter table if exists public.battlegear
  add column if not exists allowed_tribes text[] not null default '{}'::text[];

alter table if exists public.battlegear
  add column if not exists allowed_creature_ids uuid[] not null default '{}'::uuid[];

alter table if exists public.battlegear
  add column if not exists abilities jsonb not null default '[]'::jsonb;

alter table if exists public.mugic
  add column if not exists image_file_id text;

alter table if exists public.mugic
  add column if not exists image_url text;

alter table if exists public.mugic
  add column if not exists tribes text[] not null default '{}'::text[];

alter table if exists public.mugic
  add column if not exists cost integer not null default 0;

alter table if exists public.mugic
  add column if not exists abilities jsonb not null default '[]'::jsonb;

update public.mugic
set cost = 0
where cost is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'creatures_support_ability_id_fkey'
  ) then
    alter table public.creatures
      add constraint creatures_support_ability_id_fkey
      foreign key (support_ability_id)
      references public.abilities(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'creatures_brainwashed_ability_id_fkey'
  ) then
    alter table public.creatures
      add constraint creatures_brainwashed_ability_id_fkey
      foreign key (brainwashed_ability_id)
      references public.abilities(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'locations_tribes_check'
  ) then
    alter table public.locations
      add constraint locations_tribes_check
      check (tribes <@ array['overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient']::text[]);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'locations_initiative_elements_check'
  ) then
    alter table public.locations
      add constraint locations_initiative_elements_check
      check (initiative_elements <@ array['fire', 'water', 'earth', 'air']::text[]);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'battlegear_allowed_tribes_check'
  ) then
    alter table public.battlegear
      add constraint battlegear_allowed_tribes_check
      check (allowed_tribes <@ array['overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient']::text[]);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mugic_tribes_check'
  ) then
    alter table public.mugic
      add constraint mugic_tribes_check
      check (tribes <@ array['overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient']::text[]);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mugic_cost_non_negative'
  ) then
    alter table public.mugic
      add constraint mugic_cost_non_negative
      check (cost >= 0);
  end if;
end $$;

create or replace function public.is_valid_mugic_abilities(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  item jsonb;
  ability_type text;
  target_scope text;
  action_type text;
  effect_type text;
  value_num numeric;
begin
  if jsonb_typeof(payload) <> 'array' then
    return false;
  end if;

  for item in select value from jsonb_array_elements(payload)
  loop
    if jsonb_typeof(item) <> 'object' then
      return false;
    end if;

    if coalesce(nullif(item->>'description', ''), '') = '' then
      return false;
    end if;

    ability_type := coalesce(item->>'abilityType', 'stat_modifier');

    if ability_type not in ('stat_modifier', 'action') then
      return false;
    end if;

    target_scope := item->>'targetScope';

    if target_scope not in ('self', 'enemy') then
      return false;
    end if;

    if item ? 'cardTypes' then
      if jsonb_typeof(item->'cardTypes') <> 'array' then
        return false;
      end if;

      if exists (
        select 1
        from jsonb_array_elements_text(item->'cardTypes') as card(value)
        where card.value not in ('creature', 'equipment', 'attack', 'mugic', 'location')
      ) then
        return false;
      end if;
    end if;

    if ability_type = 'action' then
      action_type := item->>'actionType';

      if action_type not in (
        'flip_target_battlegear',
        'flip_target_attack',
        'destroy_target_battlegear',
        'destroy_target_attack',
        'return_target_card_to_hand',
        'cancel_target_mugic'
      ) then
        return false;
      end if;
    else
      effect_type := item->>'effectType';

      if effect_type not in ('increase', 'decrease') then
        return false;
      end if;

      if jsonb_typeof(item->'stats') <> 'array' or jsonb_array_length(item->'stats') = 0 then
        return false;
      end if;

      if exists (
        select 1
        from jsonb_array_elements_text(item->'stats') as stat(value)
        where stat.value not in ('power', 'courage', 'speed', 'wisdom', 'mugic', 'energy')
      ) then
        return false;
      end if;

      if jsonb_typeof(item->'value') <> 'number' then
        return false;
      end if;

      value_num := (item->>'value')::numeric;

      if value_num < 0 then
        return false;
      end if;
    end if;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mugic_abilities_shape_check'
  ) then
    alter table public.mugic
      add constraint mugic_abilities_shape_check
      check (public.is_valid_mugic_abilities(abilities));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'creatures_dominant_elements_check'
  ) then
    alter table public.creatures
      add constraint creatures_dominant_elements_check
      check (dominant_elements <@ array['fire', 'water', 'earth', 'air']::text[]);
  end if;
end $$;
