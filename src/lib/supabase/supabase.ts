import { SavedUserDto, SaveLoggedUserRequestDto } from "@/dto/user";
import { type UserDashboardDto, type UserWalletDto } from "@/dto/wallet";
import { createClient } from "@supabase/supabase-js";


type SupabaseUserRow = {
  id: string;
  provider: string;
  provider_account_id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  last_login_at: string;
  created_at: string;
  updated_at: string;
};

type SupabaseWalletRow = {
  id: string;
  user_id: string;
  coins: number;
  diamonds: number;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SupabaseApiError = {
  code?: string;
  message: string;
};

function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapSupabaseUserRow(row: SupabaseUserRow): SavedUserDto {
  return {
    id: row.id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    email: row.email,
    name: row.name,
    imageUrl: row.image_url,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseWalletRow(row: SupabaseWalletRow): UserWalletDto {
  return {
    id: row.id,
    userId: row.user_id,
    coins: row.coins,
    diamonds: row.diamonds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingTableError(error: SupabaseApiError): boolean {
  return error.code === "PGRST205";
}

function getUsersTableName() {
  return process.env.SUPABASE_USERS_TABLE ?? "users";
}

function getWalletsTableName() {
  return process.env.SUPABASE_WALLETS_TABLE ?? "user_wallets";
}

export async function saveLoggedUserInSupabase(
  payload: SaveLoggedUserRequestDto,
): Promise<SavedUserDto> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { data, error } = await supabase
    .from(tableName)
    .upsert(
      {
        provider: payload.provider,
        provider_account_id: payload.providerAccountId,
        email: payload.email,
        name: payload.name,
        image_url: payload.imageUrl,
        last_login_at: new Date().toISOString(),
      },
      {
        onConflict: "provider,provider_account_id",
      },
    )
    .select(
      "id,provider,provider_account_id,email,name,image_url,last_login_at,created_at,updated_at",
    )
    .single<SupabaseUserRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de salvar usuários (veja README.md).`,
      );
    }

    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  return mapSupabaseUserRow(data);
}

export async function ensureUserWalletInSupabase(
  userId: string,
): Promise<UserWalletDto> {
  const supabase = getSupabaseAdminClient();
  const tableName = getWalletsTableName();

  const { data, error } = await supabase
    .from(tableName)
    .upsert(
      {
        user_id: userId,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id,user_id,coins,diamonds,created_at,updated_at")
    .single<SupabaseWalletRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar moedas e diamantes (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabaseWalletRow(data);
}

export async function getUserDashboardByEmail(
  email: string,
): Promise<UserDashboardDto | null> {
  const supabase = getSupabaseAdminClient();
  const usersTable = getUsersTableName();
  const walletsTable = getWalletsTableName();

  const { data: userRow, error: userError } = await supabase
    .from(usersTable)
    .select("id,name,image_url")
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; name: string | null; image_url: string | null }>();

  if (userError) {
    const supabaseError = userError as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${usersTable}. Crie a tabela antes de carregar o dashboard (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  if (!userRow) {
    return null;
  }

  const { data: walletRow, error: walletError } = await supabase
    .from(walletsTable)
    .select("id,user_id,coins,diamonds,created_at,updated_at")
    .eq("user_id", userRow.id)
    .maybeSingle<SupabaseWalletRow>();

  if (walletError) {
    const supabaseError = walletError as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${walletsTable}. Crie a tabela antes de carregar moedas e diamantes (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  const wallet = walletRow
    ? mapSupabaseWalletRow(walletRow)
    : await ensureUserWalletInSupabase(userRow.id);

  return {
    userName: userRow.name,
    userImageUrl: userRow.image_url,
    coins: wallet.coins,
    diamonds: wallet.diamonds,
  };
}
