import { SavedUserDto, SaveLoggedUserRequestDto } from "@/dto/user";
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

export async function saveLoggedUserInSupabase(
  payload: SaveLoggedUserRequestDto,
): Promise<SavedUserDto> {
  const supabase = getSupabaseAdminClient();
  const tableName = process.env.SUPABASE_USERS_TABLE ?? "users";

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

    if (supabaseError.code === "PGRST205") {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de salvar usuários (veja README.md).`,
      );
    }

    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  return mapSupabaseUserRow(data);
}
