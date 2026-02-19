import type {
    SavedUserDto,
    SaveLoggedUserRequestDto,
    UserProfileDto,
    UserPermissionDto,
    UserRole,
} from "@/dto/user";
import { getSupabaseAdminClient } from "../storage";
import {
    getUsersTableName,
    isMissingTableError,
} from "../core";
import type {
    SupabaseApiError,
    SupabasePermissionUserRow,
    SupabaseUserRow,
} from "../types";

function mapSupabaseUserRow(row: SupabaseUserRow): SavedUserDto {
    return {
        id: row.id,
        role: row.role,
        provider: row.provider,
        providerAccountId: row.provider_account_id,
        email: row.email,
        name: row.name,
        nickName: row.nick_name,
        imageUrl: row.image_url,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapSupabaseUserProfileRow(row: {
    id: string;
    email: string;
    name: string | null;
    nick_name: string | null;
    image_url: string | null;
}): UserProfileDto {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        nickName: row.nick_name,
        imageUrl: row.image_url,
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
        .select("id,role,last_login_at")
        .eq("email", email)
        .order("last_login_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; role: UserRole; last_login_at: string | null }>();

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

    if (!data) {
        return null;
    }

    return {
        id: data.id,
        role: data.role,
    };
}

export async function saveLoggedUserInSupabase(
    payload: SaveLoggedUserRequestDto,
): Promise<SavedUserDto> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();
    const upsertPayload: {
        provider: string;
        provider_account_id: string;
        email: string;
        name: string | null;
        image_url: string | null;
        last_login_at: string;
        nick_name?: string | null;
    } = {
        provider: payload.provider,
        provider_account_id: payload.providerAccountId,
        email: payload.email,
        name: payload.name,
        image_url: payload.imageUrl,
        last_login_at: new Date().toISOString(),
    };

    if (payload.nickName !== undefined) {
        upsertPayload.nick_name = payload.nickName;
    }

    const { data, error } = await supabase
        .from(tableName)
        .upsert(upsertPayload, {
            onConflict: "provider,provider_account_id",
        })
        .select(
            "id,role,provider,provider_account_id,email,name,nick_name,image_url,last_login_at,created_at,updated_at",
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
        .select("role,last_login_at")
        .eq("email", email)
        .order("last_login_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ role: UserRole; last_login_at: string | null }>();

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

export async function getUserProfileByEmail(
    email: string,
): Promise<UserProfileDto | null> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,email,name,nick_name,image_url,last_login_at")
        .eq("email", email)
        .order("last_login_at", { ascending: false })
        .limit(1)
        .maybeSingle<{
            id: string;
            email: string;
            name: string | null;
            nick_name: string | null;
            image_url: string | null;
            last_login_at: string | null;
        }>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de consultar perfil (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return data
        ? mapSupabaseUserProfileRow({
            id: data.id,
            email: data.email,
            name: data.name,
            nick_name: data.nick_name,
            image_url: data.image_url,
        })
        : null;
}

export async function updateUserProfileByEmail(
    email: string,
    payload: {
        nickName?: string | null;
        imageUrl?: string | null;
    },
): Promise<UserProfileDto | null> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUsersTableName();

    const updates: {
        nick_name?: string | null;
        image_url?: string | null;
    } = {};

    if (payload.nickName !== undefined) {
        updates.nick_name = payload.nickName;
    }

    if (payload.imageUrl !== undefined) {
        updates.image_url = payload.imageUrl;
    }

    if (Object.keys(updates).length === 0) {
        return getUserProfileByEmail(email);
    }

    const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq("email", email)
        .select("id,email,name,nick_name,image_url,last_login_at")
        .order("last_login_at", { ascending: false })
        .limit(1)
        .maybeSingle<{
            id: string;
            email: string;
            name: string | null;
            nick_name: string | null;
            image_url: string | null;
            last_login_at: string | null;
        }>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de atualizar perfil (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return data
        ? mapSupabaseUserProfileRow({
            id: data.id,
            email: data.email,
            name: data.name,
            nick_name: data.nick_name,
            image_url: data.image_url,
        })
        : null;
}
