create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'user' check (role in ('user', 'admin')),
  provider text not null,
  provider_account_id text not null,
  email text not null,
  name text,
  nick_name text,
  image_url text,
  starter_tribe text check (starter_tribe in ('overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient')),
  starter_reward_granted_at timestamptz,
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

alter table if exists public.users
  add column if not exists role text not null default 'user';

alter table if exists public.users
  add column if not exists starter_tribe text;

alter table if exists public.users
  add column if not exists starter_reward_granted_at timestamptz;

alter table if exists public.users
  add column if not exists nick_name text;

alter table if exists public.users
  add column if not exists last_login_at timestamptz not null default now();

alter table if exists public.users
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.users
  add column if not exists updated_at timestamptz not null default now();

update public.users
set role = 'user'
where role is null;

update public.users
set last_login_at = now()
where last_login_at is null;

update public.users
set created_at = now()
where created_at is null;

update public.users
set updated_at = now()
where updated_at is null;

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

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_starter_tribe_check'
  ) then
    alter table public.users
      add constraint users_starter_tribe_check
      check (starter_tribe in ('overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient'));
  end if;
end $$;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_image_file_id text,
  cover_image_url text,
  cards_count integer not null default 20 check (cards_count > 0),
  players_count integer not null default 2 check (players_count > 0),
  allowed_formats text[] not null default '{"1x1"}'::text[],
  deck_archetypes text[] not null default '{}'::text[],
  max_card_energy integer,
  allowed_tribes text[] not null default '{}'::text[],
  allow_mugic boolean not null default true,
  location_mode text not null default 'random' check (location_mode in ('defined', 'random')),
  defined_locations text[] not null default '{}'::text[],
  additional_rules text,
  schedule_type text not null default 'date_range' check (schedule_type in ('date_range', 'recurring_interval')),
  start_at timestamptz,
  end_at timestamptz,
  period_days integer,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.tournaments
  add column if not exists cover_image_file_id text;

alter table if exists public.tournaments
  add column if not exists cover_image_url text;

alter table if exists public.tournaments
  add column if not exists cards_count integer not null default 20;

alter table if exists public.tournaments
  add column if not exists players_count integer not null default 2;

alter table if exists public.tournaments
  add column if not exists allowed_formats text[] not null default '{"1x1"}'::text[];

alter table if exists public.tournaments
  add column if not exists deck_archetypes text[] not null default '{}'::text[];

alter table if exists public.tournaments
  add column if not exists max_card_energy integer;

alter table if exists public.tournaments
  add column if not exists allowed_tribes text[] not null default '{}'::text[];

alter table if exists public.tournaments
  add column if not exists allow_mugic boolean not null default true;

alter table if exists public.tournaments
  add column if not exists location_mode text not null default 'random';

alter table if exists public.tournaments
  add column if not exists defined_locations text[] not null default '{}'::text[];

alter table if exists public.tournaments
  add column if not exists additional_rules text;

alter table if exists public.tournaments
  add column if not exists schedule_type text not null default 'date_range';

alter table if exists public.tournaments
  add column if not exists start_at timestamptz;

alter table if exists public.tournaments
  add column if not exists end_at timestamptz;

alter table if exists public.tournaments
  add column if not exists period_days integer;

alter table if exists public.tournaments
  add column if not exists is_enabled boolean not null default true;

alter table if exists public.tournaments
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.tournaments
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_allowed_formats_check'
  ) then
    alter table public.tournaments
      add constraint tournaments_allowed_formats_check
      check (allowed_formats <@ array['1x1', '3x3', '5x5', '7x7']::text[]);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_allowed_tribes_check'
  ) then
    alter table public.tournaments
      add constraint tournaments_allowed_tribes_check
      check (allowed_tribes <@ array['overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient']::text[]);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_cards_count_check'
  ) then
    alter table public.tournaments
      add constraint tournaments_cards_count_check
      check (cards_count > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_players_count_check'
  ) then
    alter table public.tournaments
      add constraint tournaments_players_count_check
      check (players_count > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_location_mode_check'
  ) then
    alter table public.tournaments
      add constraint tournaments_location_mode_check
      check (location_mode in ('defined', 'random'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_schedule_type_check'
  ) then
    alter table public.tournaments
      add constraint tournaments_schedule_type_check
      check (schedule_type in ('date_range', 'recurring_interval'));
  end if;
end $$;

create index if not exists idx_tournaments_schedule_type on public.tournaments(schedule_type);
create index if not exists idx_tournaments_is_enabled on public.tournaments(is_enabled);

create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  diamonds integer not null default 0 check (diamonds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.user_progression (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  xp_total integer not null default 0 check (xp_total >= 0),
  level integer not null default 1 check (level >= 1),
  xp_current_level integer not null default 0 check (xp_current_level >= 0),
  xp_next_level integer not null default 100 check (xp_next_level > 0),
  season_rank text not null default 'bronze',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_type text not null check (card_type in ('creature', 'location', 'mugic', 'battlegear', 'attack')),
  card_id uuid not null,
  rarity text not null check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_type, card_id)
);

create table if not exists public.user_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_deck_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.user_decks(id) on delete cascade,
  card_type text not null check (card_type in ('creature', 'location', 'mugic', 'battlegear', 'attack')),
  card_id uuid not null,
  quantity integer not null default 1 check (quantity >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deck_id, card_type, card_id)
);

create table if not exists public.store_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_file_id text,
  image_url text,
  cards_count integer not null default 6 check (cards_count > 0),
  card_types text[] not null default array['creature', 'location', 'mugic', 'battlegear', 'attack']::text[]
    check (card_types <@ array['creature', 'location', 'mugic', 'battlegear', 'attack']::text[] and array_length(card_types, 1) > 0),
  allowed_tribes text[] not null default '{}'::text[]
    check (allowed_tribes <@ array['overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient']::text[]),
  tribe_weights jsonb not null default '{}'::jsonb,
  rarity_weights jsonb not null default '{"comum":55,"incomum":25,"rara":14,"super_rara":5,"ultra_rara":1}'::jsonb,
  guaranteed_min_rarity text check (guaranteed_min_rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
  guaranteed_count integer not null default 0 check (guaranteed_count >= 0),
  price_coins integer check (price_coins is null or price_coins > 0),
  price_diamonds integer check (price_diamonds is null or price_diamonds > 0),
  daily_limit integer check (daily_limit is null or daily_limit >= 0),
  weekly_limit integer check (weekly_limit is null or weekly_limit >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_coins is not null or price_diamonds is not null)
);

alter table if exists public.store_packs
  add column if not exists image_file_id text;

create table if not exists public.progression_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null check (source in ('battle_victory', 'card_awarded', 'card_discarded', 'daily_login', 'shop_pack_purchase', 'shop_purchase_refund', 'starter_pack_opened')),
  xp_delta integer not null default 0 check (xp_delta >= 0),
  coins_delta integer not null default 0,
  diamonds_delta integer not null default 0,
  card_type text check (card_type in ('creature', 'location', 'mugic', 'battlegear', 'attack')),
  card_id uuid,
  card_rarity text check (card_rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
  quantity integer not null default 1 check (quantity >= 1),
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_cards_user_id on public.user_cards(user_id);
create index if not exists idx_user_decks_user_id on public.user_decks(user_id);
create index if not exists idx_user_deck_cards_deck_id on public.user_deck_cards(deck_id);
create index if not exists idx_store_packs_active on public.store_packs(is_active);
create index if not exists idx_progression_events_user_id_created_at on public.progression_events(user_id, created_at desc);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'progression_events_source_check'
  ) then
    alter table public.progression_events
      drop constraint progression_events_source_check;
  end if;

  alter table public.progression_events
    add constraint progression_events_source_check
    check (source in ('battle_victory', 'card_awarded', 'card_discarded', 'daily_login', 'shop_pack_purchase', 'shop_purchase_refund', 'starter_pack_opened'));
end $$;

create table if not exists public.creatures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_name text,
  rarity text not null default 'comum' check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
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
  support_ability_ids uuid[] not null default '{}'::uuid[],
  brainwashed_ability_ids uuid[] not null default '{}'::uuid[],
  equipment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.abilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('support', 'brainwashed', 'activated', 'innate')),
  effect_type text not null check (effect_type in ('increase', 'decrease', 'special')),
  target_scope text not null check (target_scope in ('all_creatures', 'same_tribe', 'enemy_only', 'self', 'same_side', 'opposing_creatures')),
  stat text not null check (stat in ('power', 'courage', 'speed', 'wisdom', 'energy', 'mugic', 'all', 'none')),
  value integer not null check (value >= 0),
  description text,
  battle_rules jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_name text,
  rarity text not null default 'comum' check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
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
  file_name text,
  rarity text not null default 'comum' check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
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
  rarity text not null default 'comum' check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
  image_file_id text,
  image_url text,
  tribes text[] not null default '{}'::text[],
  cost integer not null default 0 check (cost >= 0),
  abilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attacks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rarity text not null default 'comum' check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara')),
  image_file_id text,
  image_url text,
  energy_cost integer not null default 0 check (energy_cost >= 0),
  element_values jsonb not null default '[]'::jsonb,
  abilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.battlegear
  add column if not exists file_name text;

alter table if exists public.abilities
  add column if not exists target_scope text not null default 'all_creatures';

alter table if exists public.abilities
  add column if not exists battle_rules jsonb;

update public.abilities
set target_scope = 'all_creatures'
where target_scope is null;

alter table if exists public.abilities
  drop constraint if exists abilities_category_check;

alter table if exists public.abilities
  add constraint abilities_category_check
  check (category in ('support', 'brainwashed', 'activated', 'innate'));

alter table if exists public.abilities
  drop constraint if exists abilities_effect_type_check;

alter table if exists public.abilities
  add constraint abilities_effect_type_check
  check (effect_type in ('increase', 'decrease', 'special'));

alter table if exists public.abilities
  drop constraint if exists abilities_target_scope_check;

alter table if exists public.abilities
  add constraint abilities_target_scope_check
  check (target_scope in ('all_creatures', 'same_tribe', 'enemy_only', 'self', 'same_side', 'opposing_creatures'));

alter table if exists public.abilities
  drop constraint if exists abilities_stat_check;

alter table if exists public.abilities
  add constraint abilities_stat_check
  check (stat in ('power', 'courage', 'speed', 'wisdom', 'energy', 'mugic', 'all', 'none'));

alter table if exists public.abilities
  drop constraint if exists abilities_battle_rules_json_check;

alter table if exists public.abilities
  add constraint abilities_battle_rules_json_check
  check (battle_rules is null or jsonb_typeof(battle_rules) = 'object');

alter table if exists public.creatures
  add column if not exists support_ability_ids uuid[] not null default '{}'::uuid[];

alter table if exists public.creatures
  add column if not exists brainwashed_ability_ids uuid[] not null default '{}'::uuid[];

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'creatures'
      and column_name = 'support_ability_id'
  ) then
    update public.creatures
    set support_ability_ids = case
      when support_ability_id is null then support_ability_ids
      else array[support_ability_id]
    end
    where support_ability_id is not null
      and coalesce(array_length(support_ability_ids, 1), 0) = 0;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'creatures'
      and column_name = 'brainwashed_ability_id'
  ) then
    update public.creatures
    set brainwashed_ability_ids = case
      when brainwashed_ability_id is null then brainwashed_ability_ids
      else array[brainwashed_ability_id]
    end
    where brainwashed_ability_id is not null
      and coalesce(array_length(brainwashed_ability_ids, 1), 0) = 0;
  end if;
end $$;

alter table if exists public.creatures
  add column if not exists image_url text;

alter table if exists public.creatures
  add column if not exists file_name text;

alter table if exists public.creatures
  add column if not exists image_file_id text;

alter table if exists public.creatures
  add column if not exists rarity text not null default 'comum';

alter table if exists public.locations
  add column if not exists image_file_id text;

alter table if exists public.locations
  add column if not exists file_name text;

alter table if exists public.locations
  add column if not exists image_url text;

alter table if exists public.locations
  add column if not exists rarity text not null default 'comum';

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
  add column if not exists rarity text not null default 'comum';

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
  add column if not exists rarity text not null default 'comum';

alter table if exists public.mugic
  add column if not exists tribes text[] not null default '{}'::text[];

alter table if exists public.mugic
  add column if not exists cost integer not null default 0;

alter table if exists public.mugic
  add column if not exists abilities jsonb not null default '[]'::jsonb;

alter table if exists public.attacks
  add column if not exists image_file_id text;

alter table if exists public.attacks
  add column if not exists image_url text;

alter table if exists public.attacks
  add column if not exists rarity text not null default 'comum';

alter table if exists public.attacks
  add column if not exists energy_cost integer not null default 0;

alter table if exists public.attacks
  add column if not exists element_values jsonb not null default '[]'::jsonb;

alter table if exists public.attacks
  add column if not exists abilities jsonb not null default '[]'::jsonb;

update public.attacks
set energy_cost = 0
where energy_cost is null;

update public.creatures
set rarity = 'comum'
where rarity is null;

update public.locations
set rarity = 'comum'
where rarity is null;

update public.battlegear
set rarity = 'comum'
where rarity is null;

update public.mugic
set rarity = 'comum'
where rarity is null;

update public.attacks
set rarity = 'comum'
where rarity is null;

update public.mugic
set cost = 0
where cost is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'creatures_rarity_check'
  ) then
    alter table public.creatures
      add constraint creatures_rarity_check
      check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara'));
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'creatures_support_ability_id_fkey'
  ) then
    alter table public.creatures
      drop constraint creatures_support_ability_id_fkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'creatures_brainwashed_ability_id_fkey'
  ) then
    alter table public.creatures
      drop constraint creatures_brainwashed_ability_id_fkey;
  end if;
end $$;

alter table if exists public.creatures
  drop column if exists support_ability_id;

alter table if exists public.creatures
  drop column if exists brainwashed_ability_id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'locations_rarity_check'
  ) then
    alter table public.locations
      add constraint locations_rarity_check
      check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'battlegear_rarity_check'
  ) then
    alter table public.battlegear
      add constraint battlegear_rarity_check
      check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara'));
  end if;

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
    where conname = 'mugic_rarity_check'
  ) then
    alter table public.mugic
      add constraint mugic_rarity_check
      check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara'));
  end if;

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
    where conname = 'attacks_rarity_check'
  ) then
    alter table public.attacks
      add constraint attacks_rarity_check
      check (rarity in ('comum', 'incomum', 'rara', 'super_rara', 'ultra_rara'));
  end if;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attacks_energy_cost_non_negative'
  ) then
    alter table public.attacks
      add constraint attacks_energy_cost_non_negative
      check (energy_cost >= 0);
  end if;
end $$;

create or replace function public.is_valid_attack_element_values(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
begin
  if jsonb_typeof(payload) <> 'array' then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(payload) as item(value)
    where jsonb_typeof(item.value) <> 'object'
       or coalesce(item.value->>'element', '') not in ('fire', 'water', 'earth', 'air')
       or jsonb_typeof(item.value->'value') <> 'number'
       or (item.value->>'value')::numeric < 0
  ) then
    return false;
  end if;

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function public.is_valid_attack_abilities(payload jsonb)
returns boolean
language plpgsql
immutable
as $$
begin
  if jsonb_typeof(payload) <> 'array' then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(payload) as item(value)
    where jsonb_typeof(item.value) <> 'object'
       or coalesce(nullif(item.value->>'description', ''), '') = ''
       or (item.value ? 'conditionElement' and coalesce(item.value->>'conditionElement', '') not in ('fire', 'water', 'earth', 'air'))
       or coalesce(item.value->>'targetScope', '') not in ('attacker', 'defender')
       or coalesce(item.value->>'effectType', '') not in ('increase', 'decrease')
       or coalesce(item.value->>'stat', '') not in ('power', 'courage', 'speed', 'wisdom', 'mugic', 'energy')
       or jsonb_typeof(item.value->'value') <> 'number'
       or (item.value->>'value')::numeric < 0
  ) then
    return false;
  end if;

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
    where conname = 'attacks_element_values_shape_check'
  ) then
    alter table public.attacks
      add constraint attacks_element_values_shape_check
      check (public.is_valid_attack_element_values(element_values));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attacks_abilities_shape_check'
  ) then
    alter table public.attacks
      add constraint attacks_abilities_shape_check
      check (public.is_valid_attack_abilities(abilities));
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
  payload_type text;
  status_type text;
  stat_scope text;
  duration_turns numeric;
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

    if jsonb_typeof(item->'targetTribes') <> 'array' then
      return false;
    end if;

    if exists (
      select 1
      from jsonb_array_elements_text(item->'targetTribes') as tribe(value)
      where tribe.value not in ('overworld', 'underworld', 'mipedian', 'marrillian', 'danian', 'ancient')
    ) then
      return false;
    end if;

    if ability_type = 'action' then
      action_type := item->>'actionType';

      if action_type not in (
        'flip_target_battlegear',
        'flip_target_attack',
        'destroy_target_battlegear',
        'destroy_target_attack',
        'return_target_card_to_hand',
        'cancel_target_mugic',
        'discard_opponent_mugic_from_hand',
        'cancel_target_activated_ability',
        'modify_stats_map',
        'heal_target',
        'grant_mugic_counter',
        'grant_element_attack_bonus',
        'sacrifice_friendly_then_gain_energy_from_sacrificed',
        'sacrifice_friendly_then_reduce_enemy_by_sacrificed_stats',
        'banish_mugic_card_from_discard_then_deal_damage',
        'reduce_chosen_discipline',
        'apply_status_effect',
        'prevent_stat_modifiers_on_target'
      ) then
        return false;
      end if;

      if action_type = 'apply_status_effect' then
        if jsonb_typeof(item->'actionPayload') <> 'object' then
          return false;
        end if;

        payload_type := item->'actionPayload'->>'effectType';
        status_type := item->'actionPayload'->>'statusType';
        stat_scope := item->'actionPayload'->>'statScope';

        if payload_type <> 'status_effect' then
          return false;
        end if;

        if status_type not in ('exhaust_disciplines') then
          return false;
        end if;

        if stat_scope not in ('all_disciplines') then
          return false;
        end if;

        if jsonb_typeof(item->'actionPayload'->'value') <> 'number' then
          return false;
        end if;

        value_num := (item->'actionPayload'->>'value')::numeric;

        if value_num < 0 then
          return false;
        end if;

        if item->'actionPayload' ? 'durationTurns' then
          if jsonb_typeof(item->'actionPayload'->'durationTurns') <> 'number' then
            return false;
          end if;

          duration_turns := (item->'actionPayload'->>'durationTurns')::numeric;

          if duration_turns < 0 then
            return false;
          end if;
        end if;
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
