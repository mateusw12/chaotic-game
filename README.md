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
```

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
