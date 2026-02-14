import type {
    SavedUserDto,
    SaveLoggedUserRequestDto,
    UserPermissionDto,
    UserRole,
} from "@/dto/user";
import { getSupabaseAdminClient } from "./storage";
import {
    getUsersTableName,
    isMissingTableError,
} from "./core";
import type {
    SupabaseApiError,
    SupabasePermissionUserRow,
    SupabaseUserRow,
} from "./types";

function mapSupabaseUserRow(row: SupabaseUserRow): SavedUserDto {
    return {
        id: row.id,
        role: row.role,
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

function mapSupabasePermissionUserRow(
    row: SupabasePermissionUserRow,
): UserPermissionDto {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        imageUrl: row.image_url,
        role: row.role,
        updatedAt: row.updated_at,
    };
}

export async function getUserByEmail(
    email: string,
): Promise<{ id: string; role: UserRole } | null> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,role")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; role: UserRole }>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de consultar usuário (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return data ?? null;
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
            "id,role,provider,provider_account_id,email,name,image_url,last_login_at,created_at,updated_at",
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

export async function ensureDefaultAdminRoleByEmail(email: string): Promise<void> {
    const defaultAdminEmail = process.env.AUTH_DEFAULT_ADMIN_EMAIL;

    if (!defaultAdminEmail) {
        return;
    }

    if (email.toLowerCase() !== defaultAdminEmail.toLowerCase()) {
        return;
    }

    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const { error } = await supabase
        .from(tableName)
        .update({ role: "admin" })
        .eq("email", email)
        .neq("role", "admin");

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de gerenciar roles (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }
}

export async function getUserRoleByEmail(email: string): Promise<UserRole | null> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("role")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ role: UserRole }>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de consultar roles (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return data?.role ?? null;
}

export async function listUsersWithRoles(): Promise<UserPermissionDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,email,image_url,role,updated_at")
        .order("updated_at", { ascending: false })
        .returns<SupabasePermissionUserRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de listar permissões (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return (data ?? []).map(mapSupabasePermissionUserRow);
}

export async function updateUserRoleById(
    userId: string,
    role: UserRole,
): Promise<UserPermissionDto> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({ role })
        .eq("id", userId)
        .select("id,name,email,image_url,role,updated_at")
        .single<SupabasePermissionUserRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de atualizar permissões (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return mapSupabasePermissionUserRow(data);
}
