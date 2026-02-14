import { type AdminUserWalletDto, type UserDashboardDto, type UserWalletDto } from "@/dto/wallet";
import type { UserRole } from "@/dto/user";
import { getSupabaseAdminClient } from "./storage";
import {
    getUserProgressionTableName,
    getUsersTableName,
    getWalletsTableName,
    isMissingTableError,
} from "./core";
import type { SupabaseApiError, SupabaseWalletRow } from "./types";
import { ensureUserProgressionInSupabase } from "./progression";
import { listUsersWithRoles } from "./users";

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
    const progressionTable = getUserProgressionTableName();

    const { data: userRow, error: userError } = await supabase
        .from(usersTable)
        .select("id,name,nick_name,image_url,role,last_login_at")
        .eq("email", email)
        .order("last_login_at", { ascending: false })
        .limit(1)
        .maybeSingle<{
            id: string;
            name: string | null;
            nick_name: string | null;
            image_url: string | null;
            role: UserRole;
            last_login_at: string | null;
        }>();

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

    const { data: progressionRow, error: progressionError } = await supabase
        .from(progressionTable)
        .select("id,user_id,xp_total,level,xp_current_level,xp_next_level,season_rank,created_at,updated_at")
        .eq("user_id", userRow.id)
        .maybeSingle<{
            id: string;
            user_id: string;
            xp_total: number;
            level: number;
            xp_current_level: number;
            xp_next_level: number;
            season_rank: string;
            created_at: string;
            updated_at: string;
        }>();

    if (progressionError) {
        const supabaseError = progressionError as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${progressionTable}. Crie a tabela antes de carregar progressão (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    const ensuredProgression = progressionRow
        ? {
            level: progressionRow.level,
            xpTotal: progressionRow.xp_total,
            xpCurrentLevel: progressionRow.xp_current_level,
            xpNextLevel: progressionRow.xp_next_level,
        }
        : await ensureUserProgressionInSupabase(userRow.id).then((item) => ({
            level: item.level,
            xpTotal: item.xpTotal,
            xpCurrentLevel: item.xpCurrentLevel,
            xpNextLevel: item.xpNextLevel,
        }));

    return {
        userName: userRow.name,
        userNickName: userRow.nick_name,
        userImageUrl: userRow.image_url,
        userRole: userRow.role,
        coins: wallet.coins,
        diamonds: wallet.diamonds,
        level: ensuredProgression.level,
        xpTotal: ensuredProgression.xpTotal,
        xpCurrentLevel: ensuredProgression.xpCurrentLevel,
        xpNextLevel: ensuredProgression.xpNextLevel,
    };
}

export async function listAdminUserWallets(): Promise<AdminUserWalletDto[]> {
    const users = await listUsersWithRoles();

    const wallets = await Promise.all(users.map(async (user) => {
        const wallet = await ensureUserWalletInSupabase(user.id);

        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            coins: wallet.coins,
            diamonds: wallet.diamonds,
        } satisfies AdminUserWalletDto;
    }));

    return wallets;
}

export async function creditUserWalletByUserId(
    userId: string,
    coinsToAdd: number,
    diamondsToAdd: number,
): Promise<UserWalletDto> {
    const normalizedCoins = Math.max(0, Math.trunc(coinsToAdd));
    const normalizedDiamonds = Math.max(0, Math.trunc(diamondsToAdd));

    if (normalizedCoins === 0 && normalizedDiamonds === 0) {
        throw new Error("Informe ao menos uma quantidade positiva de moedas ou diamantes.");
    }

    const currentWallet = await ensureUserWalletInSupabase(userId);
    const tableName = getWalletsTableName();
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            coins: currentWallet.coins + normalizedCoins,
            diamonds: currentWallet.diamonds + normalizedDiamonds,
        })
        .eq("id", currentWallet.id)
        .select("id,user_id,coins,diamonds,created_at,updated_at")
        .single<SupabaseWalletRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de creditar saldos (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return mapSupabaseWalletRow(data);
}
