import type { CardRarity } from "@/dto/creature";
import {
    type ProgressionEventDto,
    type ProgressionEventSource,
    type UserCardInventoryItemDto,
    type UserCardType,
    type UserProgressionDto,
    type UserProgressionOverviewDto,
    isValidUserCardType,
} from "@/dto/progression";
import {
    getAttacksTableName,
    getBattlegearTableName,
    getCreaturesTableName,
    getLocationsTableName,
    getMugicTableName,
    getProgressionEventsTableName,
    getUserCardsTableName,
    getUserProgressionTableName,
    getWalletsTableName,
    isMissingTableError,
} from "./core";
import {
    getAttackImagePublicUrl,
    getBattlegearImagePublicUrl,
    getCreatureImagePublicUrl,
    getLocationImagePublicUrl,
    getMugicImagePublicUrl,
    getSupabaseAdminClient,
} from "./storage";
import type {
    SupabaseApiError,
    SupabaseProgressionEventRow,
    SupabaseUserCardRow,
    SupabaseUserProgressionRow,
} from "./types";

const BATTLE_VICTORY_XP = 50;
const DAILY_LOGIN_XP = 5;
const DAILY_LOGIN_COINS = 5;

const XP_BY_RARITY: Record<CardRarity, number> = {
    comum: 8,
    incomum: 16,
    rara: 28,
    super_rara: 45,
    ultra_rara: 70,
};

const DISCARD_COINS_BY_RARITY: Record<CardRarity, number> = {
    comum: 20,
    incomum: 45,
    rara: 90,
    super_rara: 170,
    ultra_rara: 300,
};

function getXpRequiredForLevel(level: number): number {
    return 100 + 25 * (level - 1);
}

function getLevelStateFromXpTotal(xpTotal: number): Pick<UserProgressionDto, "level" | "xpCurrentLevel" | "xpNextLevel"> {
    let level = 1;
    let remainingXp = Math.max(0, xpTotal);
    let xpNextLevel = getXpRequiredForLevel(level);

    while (remainingXp >= xpNextLevel) {
        remainingXp -= xpNextLevel;
        level += 1;
        xpNextLevel = getXpRequiredForLevel(level);
    }

    return {
        level,
        xpCurrentLevel: remainingXp,
        xpNextLevel,
    };
}

function mapProgressionRow(row: SupabaseUserProgressionRow): UserProgressionDto {
    return {
        id: row.id,
        userId: row.user_id,
        xpTotal: row.xp_total,
        level: row.level,
        xpCurrentLevel: row.xp_current_level,
        xpNextLevel: row.xp_next_level,
        seasonRank: row.season_rank,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapEventRow(row: SupabaseProgressionEventRow): ProgressionEventDto {
    return {
        id: row.id,
        userId: row.user_id,
        source: row.source,
        xpDelta: row.xp_delta,
        coinsDelta: row.coins_delta,
        diamondsDelta: row.diamonds_delta,
        cardType: row.card_type,
        cardId: row.card_id,
        cardRarity: row.card_rarity,
        quantity: row.quantity,
        referenceId: row.reference_id,
        metadata: row.metadata,
        createdAt: row.created_at,
    };
}

function mapCardRow(row: SupabaseUserCardRow, cardName: string | null, cardImageUrl: string | null): UserCardInventoryItemDto {
    return {
        id: row.id,
        userId: row.user_id,
        cardType: row.card_type,
        cardId: row.card_id,
        cardName,
        cardImageUrl,
        rarity: row.rarity,
        quantity: row.quantity,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function ensureWalletForProgression(userId: string): Promise<{ id: string; coins: number; diamonds: number }> {
    const supabase = getSupabaseAdminClient();
    const tableName = getWalletsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .upsert({ user_id: userId }, { onConflict: "user_id" })
        .select("id,coins,diamonds")
        .single<{ id: string; coins: number; diamonds: number }>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar progressão (veja supabase/schema.sql).`);
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return data;
}

async function resolveCardSummary(cardType: UserCardType, cardId: string): Promise<{ cardName: string | null; cardImageUrl: string | null }> {
    const supabase = getSupabaseAdminClient();

    if (cardType === "creature") {
        const { data } = await supabase
            .from(getCreaturesTableName())
            .select("name,image_file_id,image_url")
            .eq("id", cardId)
            .maybeSingle<{ name: string; image_file_id: string | null; image_url: string | null }>();

        return {
            cardName: data?.name ?? null,
            cardImageUrl: data?.image_file_id ? getCreatureImagePublicUrl(data.image_file_id) : (data?.image_url ?? null),
        };
    }

    if (cardType === "location") {
        const { data } = await supabase
            .from(getLocationsTableName())
            .select("name,image_file_id,image_url")
            .eq("id", cardId)
            .maybeSingle<{ name: string; image_file_id: string | null; image_url: string | null }>();

        return {
            cardName: data?.name ?? null,
            cardImageUrl: data?.image_file_id ? getLocationImagePublicUrl(data.image_file_id) : (data?.image_url ?? null),
        };
    }

    if (cardType === "mugic") {
        const { data } = await supabase
            .from(getMugicTableName())
            .select("name,image_file_id,image_url")
            .eq("id", cardId)
            .maybeSingle<{ name: string; image_file_id: string | null; image_url: string | null }>();

        return {
            cardName: data?.name ?? null,
            cardImageUrl: data?.image_file_id ? getMugicImagePublicUrl(data.image_file_id) : (data?.image_url ?? null),
        };
    }

    if (cardType === "battlegear") {
        const { data } = await supabase
            .from(getBattlegearTableName())
            .select("name,image_file_id,image_url")
            .eq("id", cardId)
            .maybeSingle<{ name: string; image_file_id: string | null; image_url: string | null }>();

        return {
            cardName: data?.name ?? null,
            cardImageUrl: data?.image_file_id ? getBattlegearImagePublicUrl(data.image_file_id) : (data?.image_url ?? null),
        };
    }

    const { data } = await supabase
        .from(getAttacksTableName())
        .select("name,image_file_id,image_url")
        .eq("id", cardId)
        .maybeSingle<{ name: string; image_file_id: string | null; image_url: string | null }>();

    return {
        cardName: data?.name ?? null,
        cardImageUrl: data?.image_file_id ? getAttackImagePublicUrl(data.image_file_id) : (data?.image_url ?? null),
    };
}

export async function ensureUserProgressionInSupabase(userId: string): Promise<UserProgressionDto> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUserProgressionTableName();

    const { data, error } = await supabase
        .from(tableName)
        .upsert({
            user_id: userId,
            xp_total: 0,
            level: 1,
            xp_current_level: 0,
            xp_next_level: getXpRequiredForLevel(1),
            season_rank: "bronze",
        }, {
            onConflict: "user_id",
        })
        .select("id,user_id,xp_total,level,xp_current_level,xp_next_level,season_rank,created_at,updated_at")
        .single<SupabaseUserProgressionRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar progressão (veja supabase/schema.sql).`);
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapProgressionRow(data);
}

type ApplyProgressionEventInput = {
    userId: string;
    source: ProgressionEventSource;
    xpDelta: number;
    coinsDelta?: number;
    diamondsDelta?: number;
    cardType?: UserCardType | null;
    cardId?: string | null;
    cardRarity?: CardRarity | null;
    quantity?: number;
    referenceId?: string | null;
    metadata?: Record<string, unknown>;
};

export async function applyProgressionEvent(
    input: ApplyProgressionEventInput,
): Promise<{ progression: UserProgressionDto; wallet: { coins: number; diamonds: number } }> {
    const xpDelta = Math.max(0, Math.trunc(input.xpDelta));
    const coinsDelta = Math.trunc(input.coinsDelta ?? 0);
    const diamondsDelta = Math.trunc(input.diamondsDelta ?? 0);
    const quantity = Math.max(1, Math.trunc(input.quantity ?? 1));

    const progression = await ensureUserProgressionInSupabase(input.userId);
    const wallet = await ensureWalletForProgression(input.userId);

    const nextXpTotal = Math.max(0, progression.xpTotal + xpDelta);
    const levelState = getLevelStateFromXpTotal(nextXpTotal);

    const nextCoins = wallet.coins + coinsDelta;
    const nextDiamonds = wallet.diamonds + diamondsDelta;

    if (nextCoins < 0 || nextDiamonds < 0) {
        throw new Error("Saldo insuficiente para aplicar o evento de progressão.");
    }

    const supabase = getSupabaseAdminClient();

    const progressionTable = getUserProgressionTableName();
    const walletsTable = getWalletsTableName();
    const eventsTable = getProgressionEventsTableName();

    const { data: updatedProgression, error: progressionError } = await supabase
        .from(progressionTable)
        .update({
            xp_total: nextXpTotal,
            level: levelState.level,
            xp_current_level: levelState.xpCurrentLevel,
            xp_next_level: levelState.xpNextLevel,
        })
        .eq("id", progression.id)
        .select("id,user_id,xp_total,level,xp_current_level,xp_next_level,season_rank,created_at,updated_at")
        .single<SupabaseUserProgressionRow>();

    if (progressionError) {
        throw new Error(`Erro ao atualizar progressão: ${progressionError.message}`);
    }

    const { error: walletError } = await supabase
        .from(walletsTable)
        .update({
            coins: nextCoins,
            diamonds: nextDiamonds,
        })
        .eq("id", wallet.id);

    if (walletError) {
        throw new Error(`Erro ao atualizar carteira: ${walletError.message}`);
    }

    const { error: eventError } = await supabase
        .from(eventsTable)
        .insert({
            user_id: input.userId,
            source: input.source,
            xp_delta: xpDelta,
            coins_delta: coinsDelta,
            diamonds_delta: diamondsDelta,
            card_type: input.cardType ?? null,
            card_id: input.cardId ?? null,
            card_rarity: input.cardRarity ?? null,
            quantity,
            reference_id: input.referenceId ?? null,
            metadata: input.metadata ?? {},
        });

    if (eventError) {
        throw new Error(`Erro ao registrar evento de progressão: ${eventError.message}`);
    }

    return {
        progression: mapProgressionRow(updatedProgression),
        wallet: {
            coins: nextCoins,
            diamonds: nextDiamonds,
        },
    };
}

export async function listUserCardInventory(userId: string): Promise<UserCardInventoryItemDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getUserCardsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,user_id,card_type,card_id,rarity,quantity,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .returns<SupabaseUserCardRow[]>();

    if (error) {
        throw new Error(`Erro ao listar coleção do usuário: ${error.message}`);
    }

    const items = await Promise.all((data ?? []).map(async (row) => {
        const summary = await resolveCardSummary(row.card_type, row.card_id);
        return mapCardRow(row, summary.cardName, summary.cardImageUrl);
    }));

    return items;
}

export async function listRecentProgressionEvents(userId: string, limit = 20): Promise<ProgressionEventDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getProgressionEventsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,user_id,source,xp_delta,coins_delta,diamonds_delta,card_type,card_id,card_rarity,quantity,reference_id,metadata,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)
        .returns<SupabaseProgressionEventRow[]>();

    if (error) {
        throw new Error(`Erro ao listar eventos de progressão: ${error.message}`);
    }

    return (data ?? []).map(mapEventRow);
}

export async function getUserProgressionOverview(userId: string): Promise<UserProgressionOverviewDto> {
    const progression = await ensureUserProgressionInSupabase(userId);
    const wallet = await ensureWalletForProgression(userId);
    const [inventory, recentEvents] = await Promise.all([
        listUserCardInventory(userId),
        listRecentProgressionEvents(userId, 15),
    ]);

    return {
        progression,
        inventory,
        recentEvents,
        coins: wallet.coins,
        diamonds: wallet.diamonds,
    };
}

export async function registerBattleVictory(userId: string, referenceId?: string | null) {
    return applyProgressionEvent({
        userId,
        source: "battle_victory",
        xpDelta: BATTLE_VICTORY_XP,
        referenceId,
        metadata: {
            rule: "battle_victory",
            xp: BATTLE_VICTORY_XP,
        },
    });
}

function getUtcDayWindow(date: Date): { dayKey: string; dayStartIso: string; nextDayStartIso: string } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const nextDayStart = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

    return {
        dayKey: dayStart.toISOString().slice(0, 10),
        dayStartIso: dayStart.toISOString(),
        nextDayStartIso: nextDayStart.toISOString(),
    };
}

async function hasDailyLoginRewardForUtcDay(userId: string, now: Date): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    const eventsTable = getProgressionEventsTableName();
    const { dayStartIso, nextDayStartIso } = getUtcDayWindow(now);

    const { data, error } = await supabase
        .from(eventsTable)
        .select("id")
        .eq("user_id", userId)
        .eq("source", "daily_login")
        .gte("created_at", dayStartIso)
        .lt("created_at", nextDayStartIso)
        .limit(1)
        .maybeSingle<{ id: string }>();

    if (error) {
        throw new Error(`Erro ao consultar recompensa diária de login: ${error.message}`);
    }

    return Boolean(data?.id);
}

export async function registerDailyLoginReward(userId: string, now = new Date()) {
    const alreadyGranted = await hasDailyLoginRewardForUtcDay(userId, now);

    if (alreadyGranted) {
        const progression = await ensureUserProgressionInSupabase(userId);
        const wallet = await ensureWalletForProgression(userId);

        return {
            granted: false,
            progression,
            wallet,
        };
    }

    const { dayKey } = getUtcDayWindow(now);
    const result = await applyProgressionEvent({
        userId,
        source: "daily_login",
        xpDelta: DAILY_LOGIN_XP,
        coinsDelta: DAILY_LOGIN_COINS,
        referenceId: `daily-login-${dayKey}`,
        metadata: {
            rule: "daily_login",
            xp: DAILY_LOGIN_XP,
            coins: DAILY_LOGIN_COINS,
            dayKey,
        },
    });

    return {
        granted: true,
        progression: result.progression,
        wallet: result.wallet,
    };
}

type RegisterCardAwardInput = {
    userId: string;
    cardType: UserCardType;
    cardId: string;
    rarity: CardRarity;
    quantity?: number;
    referenceId?: string | null;
};

export async function registerCardAward(input: RegisterCardAwardInput) {
    if (!isValidUserCardType(input.cardType)) {
        throw new Error("Tipo de carta inválido.");
    }

    const quantity = Math.max(1, Math.trunc(input.quantity ?? 1));
    const supabase = getSupabaseAdminClient();
    const cardsTable = getUserCardsTableName();

    const { data: currentCard, error: cardLoadError } = await supabase
        .from(cardsTable)
        .select("id,user_id,card_type,card_id,rarity,quantity,created_at,updated_at")
        .eq("user_id", input.userId)
        .eq("card_type", input.cardType)
        .eq("card_id", input.cardId)
        .maybeSingle<SupabaseUserCardRow>();

    if (cardLoadError) {
        throw new Error(`Erro ao consultar coleção do usuário: ${cardLoadError.message}`);
    }

    if (currentCard) {
        const { error: updateError } = await supabase
            .from(cardsTable)
            .update({
                quantity: currentCard.quantity + quantity,
                rarity: input.rarity,
            })
            .eq("id", currentCard.id);

        if (updateError) {
            throw new Error(`Erro ao atualizar carta do usuário: ${updateError.message}`);
        }
    } else {
        const { error: insertError } = await supabase
            .from(cardsTable)
            .insert({
                user_id: input.userId,
                card_type: input.cardType,
                card_id: input.cardId,
                rarity: input.rarity,
                quantity,
            });

        if (insertError) {
            throw new Error(`Erro ao adicionar carta ao usuário: ${insertError.message}`);
        }
    }

    const xpDelta = XP_BY_RARITY[input.rarity] * quantity;

    return applyProgressionEvent({
        userId: input.userId,
        source: "card_awarded",
        xpDelta,
        cardType: input.cardType,
        cardId: input.cardId,
        cardRarity: input.rarity,
        quantity,
        referenceId: input.referenceId,
        metadata: {
            rule: "card_awarded",
            rarityXp: XP_BY_RARITY[input.rarity],
            totalXp: xpDelta,
        },
    });
}

export async function discardUserCardById(userId: string, userCardId: string, quantityInput?: number) {
    const quantity = Math.max(1, Math.trunc(quantityInput ?? 1));
    const supabase = getSupabaseAdminClient();
    const cardsTable = getUserCardsTableName();

    const { data: userCard, error: cardError } = await supabase
        .from(cardsTable)
        .select("id,user_id,card_type,card_id,rarity,quantity,created_at,updated_at")
        .eq("id", userCardId)
        .eq("user_id", userId)
        .single<SupabaseUserCardRow>();

    if (cardError || !userCard) {
        throw new Error("Carta não encontrada na coleção do usuário.");
    }

    if (userCard.quantity < quantity) {
        throw new Error("Quantidade para descarte maior que o total disponível.");
    }

    const remaining = userCard.quantity - quantity;

    if (remaining === 0) {
        const { error: deleteError } = await supabase
            .from(cardsTable)
            .delete()
            .eq("id", userCard.id);

        if (deleteError) {
            throw new Error(`Erro ao descartar carta: ${deleteError.message}`);
        }
    } else {
        const { error: updateError } = await supabase
            .from(cardsTable)
            .update({ quantity: remaining })
            .eq("id", userCard.id);

        if (updateError) {
            throw new Error(`Erro ao atualizar quantidade após descarte: ${updateError.message}`);
        }
    }

    const coinsDelta = DISCARD_COINS_BY_RARITY[userCard.rarity] * quantity;

    return applyProgressionEvent({
        userId,
        source: "card_discarded",
        xpDelta: 0,
        coinsDelta,
        cardType: userCard.card_type,
        cardId: userCard.card_id,
        cardRarity: userCard.rarity,
        quantity,
        metadata: {
            rule: "card_discarded",
            coinsByRarity: DISCARD_COINS_BY_RARITY[userCard.rarity],
            totalCoins: coinsDelta,
        },
    });
}