This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Authentication setup (NextAuth + Google)

1. Copy `.env.example` to `.env`.
2. Fill these variables:

```bash
AUTH_SECRET=your_random_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_DEFAULT_ADMIN_EMAIL=admin@email.com
```

3. In Google Cloud Console, configure OAuth redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

## Supabase user sync

Add these variables in `.env`:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_USERS_TABLE=users
SUPABASE_WALLETS_TABLE=user_wallets
SUPABASE_CREATURES_TABLE=creatures
SUPABASE_ABILITIES_TABLE=abilities
SUPABASE_CREATURE_IMAGES_BUCKET=creature-images
SUPABASE_LOCATIONS_TABLE=locations
SUPABASE_LOCATION_IMAGES_BUCKET=location-images
SUPABASE_BATTLEGEAR_TABLE=battlegear
SUPABASE_BATTLEGEAR_IMAGES_BUCKET=battlegear-images
SUPABASE_MUGIC_TABLE=mugic
SUPABASE_MUGIC_IMAGES_BUCKET=mugic-images
SUPABASE_ATTACKS_TABLE=attacks
SUPABASE_ATTACKS_IMAGES_BUCKET=attacks-images
SUPABASE_USER_PROGRESSION_TABLE=user_progression
SUPABASE_PROGRESSION_EVENTS_TABLE=progression_events
SUPABASE_USER_CARDS_TABLE=user_cards
```

For creature images, create a Supabase Storage bucket (public) with the same name as `SUPABASE_CREATURE_IMAGES_BUCKET`.

The API route for manual sync is:

```text
POST /api/users/sync
```

Request body DTO (`SaveLoggedUserRequestDto`):

```json
{
  "provider": "google",
  "providerAccountId": "google_provider_account_id",
  "email": "user@email.com",
  "name": "Nome do usuário",
  "imageUrl": "https://..."
}
```

Response DTO (`SaveLoggedUserResponseDto`):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "provider": "google",
    "providerAccountId": "...",
    "email": "user@email.com",
    "name": "Nome",
    "imageUrl": "https://...",
    "lastLoginAt": "2026-02-14T00:00:00.000Z",
    "createdAt": "2026-02-14T00:00:00.000Z",
    "updatedAt": "2026-02-14T00:00:00.000Z"
  }
}
```

The project also syncs automatically on successful login via NextAuth `events.signIn`.

By default, every new user starts with role `user`. If `AUTH_DEFAULT_ADMIN_EMAIL` is set, that email is promoted to `admin` automatically on login.

Admin permission management:

- Page: `/admin/permissions`
- List API: `GET /api/admin/users`
- Update role API: `PATCH /api/admin/users/:userId/role`

Creature registration (admin):

- Page: `/admin/creatures`
- API: `GET /api/admin/creatures`
- API: `POST /api/admin/creatures`
- Upload API: `POST /api/admin/uploads/creatures` (multipart form-data with `file`)
- Creature payload stores only `imageFileId` (Storage path), and URL is resolved for display.
- Ability API: `GET /api/admin/abilities`
- Ability API: `POST /api/admin/abilities`

Location registration (admin):

- Page: `/admin/locations`
- API: `GET /api/admin/locations`
- API: `POST /api/admin/locations`
- Upload API: `POST /api/admin/uploads/locations` (multipart form-data with `file`)

Ability parameters:

- `category`: `support` | `brainwashed`
- `effectType`: `increase` | `decrease`
- `stat`: `power` | `courage` | `speed` | `wisdom` | `energy`
- `value`: integer >= 0
- `targetScope`: `all_creatures` | `same_tribe` | `enemy_only`

Progressão (XP, nível, coleção e descarte):

- Usuário autenticado:
  - `GET /api/progression/overview`
  - `POST /api/progression/battle-victory`
  - `POST /api/progression/cards/discard`
- Admin:
  - `POST /api/admin/progression/cards/award`

Regras iniciais de progressão:

- XP por vitória em batalha: `50`
- Login diário (1x por dia UTC): `5 XP` + `5 moedas`
- XP por carta adquirida (por unidade):
  - `comum: 8`, `incomum: 16`, `rara: 28`, `super_rara: 45`, `ultra_rara: 70`
- Moedas por descarte (por unidade):
  - `comum: 20`, `incomum: 45`, `rara: 90`, `super_rara: 170`, `ultra_rara: 300`
- Curva de nível:
  - XP para próximo nível = `100 + 25 * (nível - 1)`

Creatures fixed fields:

- name
- tribe enum: `overworld`, `underworld`, `mipedian`, `marrillian`, `danian`, `ancient`
- stats: `power`, `courage`, `speed`, `wisdom`, `mugic`, `energy`
- dominant elements enum: `fire`, `water`, `earth`, `air`
- support ability: vínculo para habilidade cadastrada (category = `support`)
- brainwashed ability: vínculo para habilidade cadastrada (category = `brainwashed`)
- temporary notes: equipment

Suggested SQL table:

```sql
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
	unique(provider, provider_account_id)
);

alter table if exists public.users
	add column if not exists role text not null default 'user';

create table if not exists public.user_wallets (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users(id) on delete cascade,
	coins integer not null default 0 check (coins >= 0),
	diamonds integer not null default 0 check (diamonds >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique(user_id)
);

create table if not exists public.creatures (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	image_file_id text,
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
```

You can also run the ready file: `supabase/schema.sql` in Supabase SQL Editor.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
