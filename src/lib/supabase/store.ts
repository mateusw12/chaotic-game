import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type {
    AdminStorePackDto,
    CreateAdminStorePackRequestDto,
    StoreCurrency,
    StorePackDto,
    StorePackPriceOptionDto,
    StoreRevealCardDto,
    StoreSellCardInputDto,
    UpdateAdminStorePackRequestDto,
} from "@/dto/store";
import {
    getAttacksTableName,
    getBattlegearTableName,
    getCreaturesTableName,
    getLocationsTableName,
    getMugicTableName,
    getProgressionEventsTableName,
    getStorePacksTableName,
    getUserCardsTableName,
} from "./core";
import {
    getAttackImagePublicUrl,
    getBattlegearImagePublicUrl,
    getCreatureImagePublicUrl,
    getLocationImagePublicUrl,
    getMugicImagePublicUrl,
    getStorePackImagePublicUrl,
    getSupabaseAdminClient,
} from "./storage";
import { applyProgressionEvent, discardUserCardByReference, getCardSellValue, registerCardAward } from "./progression";
import { ensureUserWalletInSupabase } from "./wallets";
import type { ProgressionEventSource, UserCardType, UserProgressionDto } from "@/dto/progression";

const RARITY_ORDER: CardRarity[] = ["comum", "incomum", "rara", "super_rara", "ultra_rara"];
const STORE_PACK_PURCHASE_SOURCE: ProgressionEventSource = "shop_pack_purchase";
const STORE_PACK_REFUND_SOURCE: ProgressionEventSource = "shop_purchase_refund";

type StorePackConfig = {
    id: string;
    name: string;
    description: string;
    imageUrl?: string | null;
    currency: "coins" | "diamonds";
    price: number;
    priceOptions?: StorePackPriceOptionDto[];
    cardsCount: number;
    cardTypes: UserCardType[];
    tribeFilter: CreatureTribe | null;
    allowedTribes?: CreatureTribe[];
    tribeWeights?: Partial<Record<CreatureTribe, number>>;
    guaranteedMinRarity: CardRarity | null;
    guaranteedCount: number;
    rarityWeights: Record<CardRarity, number>;
    dailyLimit?: number;
    weeklyLimit?: number;
};

type StoreCardPoolItem = {
    cardType: UserCardType;
    cardId: string;
    rarity: CardRarity;
    cardName: string | null;
    cardImageUrl: string | null;
    tribes: CreatureTribe[];
};

type SupabaseStorePackRow = {
    id: string;
    name: string;
    description: string | null;
    image_file_id: string | null;
    image_url: string | null;
    cards_count: number;
    card_types: UserCardType[];
    allowed_tribes: CreatureTribe[];
    tribe_weights: Partial<Record<CreatureTribe, number>> | null;
    rarity_weights: Record<CardRarity, number>;
    guaranteed_min_rarity: CardRarity | null;
    guaranteed_count: number;
    price_coins: number | null;
    price_diamonds: number | null;
    daily_limit: number | null;
    weekly_limit: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

const STORE_PACKS: StorePackConfig[] = [
    {
        id: "starter_coins",
        name: "Pacote Starter",
        description: "Pacote misto básico para evolução inicial.",
        currency: "coins",
        price: 200,
        cardsCount: 6,
        cardTypes: ["creature", "location", "mugic", "attack", "battlegear"],
        tribeFilter: null,
        guaranteedMinRarity: "rara",
        guaranteedCount: 1,
        rarityWeights: { comum: 55, incomum: 28, rara: 12, super_rara: 4, ultra_rara: 1 },
        dailyLimit: 2,
    },
    {
        id: "locations_weekly",
        name: "Pacote de Locais",
        description: "Apenas locais para montar arenas estratégicas.",
        currency: "coins",
        price: 260,
        cardsCount: 5,
        cardTypes: ["location"],
        tribeFilter: null,
        guaranteedMinRarity: "incomum",
        guaranteedCount: 2,
        rarityWeights: { comum: 48, incomum: 34, rara: 13, super_rara: 4, ultra_rara: 1 },
        weeklyLimit: 3,
    },
    {
        id: "combat_core",
        name: "Pacote de Combate",
        description: "Ataques e equipamentos para fortalecer o deck.",
        currency: "coins",
        price: 280,
        cardsCount: 5,
        cardTypes: ["attack", "battlegear"],
        tribeFilter: null,
        guaranteedMinRarity: "rara",
        guaranteedCount: 1,
        rarityWeights: { comum: 50, incomum: 30, rara: 14, super_rara: 5, ultra_rara: 1 },
        dailyLimit: 1,
    },
    {
        id: "region_overworld",
        name: "Misto Outro Mundo",
        description: "Pacote regional com foco em OverWorld.",
        currency: "diamonds",
        price: 25,
        cardsCount: 6,
        cardTypes: ["creature", "location", "mugic", "battlegear"],
        tribeFilter: "overworld",
        guaranteedMinRarity: "rara",
        guaranteedCount: 2,
        rarityWeights: { comum: 35, incomum: 33, rara: 20, super_rara: 9, ultra_rara: 3 },
        weeklyLimit: 2,
    },
    {
        id: "region_danian",
        name: "Misto Danian",
        description: "Pacote regional com foco em Danian.",
        currency: "diamonds",
        price: 25,
        cardsCount: 6,
        cardTypes: ["creature", "location", "mugic", "battlegear"],
        tribeFilter: "danian",
        guaranteedMinRarity: "rara",
        guaranteedCount: 2,
        rarityWeights: { comum: 35, incomum: 33, rara: 20, super_rara: 9, ultra_rara: 3 },
        weeklyLimit: 2,
    },
    {
        id: "rare_guaranteed",
        name: "Carta Rara Garantida",
        description: "Pacote premium com chance elevada de alta raridade.",
        currency: "diamonds",
        price: 40,
        cardsCount: 5,
        cardTypes: ["creature", "location", "mugic", "attack", "battlegear"],
        tribeFilter: null,
        guaranteedMinRarity: "super_rara",
        guaranteedCount: 1,
        rarityWeights: { comum: 20, incomum: 28, rara: 28, super_rara: 18, ultra_rara: 6 },
        weeklyLimit: 2,
    },
];

type ProgressionEventWindow = {
    startIso: string;
    endIso: string;
};

function getUtcDayWindow(now: Date): ProgressionEventWindow {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}

function getUtcWeekWindow(now: Date): ProgressionEventWindow {
    const dayIndex = now.getUTCDay();
    const offsetToMonday = (dayIndex + 6) % 7;
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offsetToMonday, 0, 0, 0, 0));
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);

    return {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
    };
}

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function getRarityRank(rarity: CardRarity): number {
    return RARITY_ORDER.indexOf(rarity);
}

function rollRarity(weights: Record<CardRarity, number>): CardRarity {
    const normalized = RARITY_ORDER.map((rarity) => ({ rarity, weight: Math.max(0, Math.trunc(weights[rarity] ?? 0)) }));
    const total = normalized.reduce((sum, item) => sum + item.weight, 0);

    if (total <= 0) {
        return "comum";
    }

    let cursor = Math.random() * total;

    for (const item of normalized) {
        cursor -= item.weight;
        if (cursor <= 0) {
            return item.rarity;
        }
    }

    return "comum";
}

function getPackPriceOptions(pack: StorePackConfig): StorePackPriceOptionDto[] {
    if (pack.priceOptions && pack.priceOptions.length > 0) {
        return pack.priceOptions
            .map((option) => ({
                currency: option.currency,
                price: Math.max(0, Math.trunc(option.price)),
            }))
            .filter((option) => option.price > 0);
    }

    return [{ currency: pack.currency, price: Math.max(0, Math.trunc(pack.price)) }].filter((option) => option.price > 0);
}

function getPackAllowedTribes(pack: StorePackConfig): CreatureTribe[] {
    if (pack.allowedTribes && pack.allowedTribes.length > 0) {
        return [...new Set(pack.allowedTribes)];
    }

    return pack.tribeFilter ? [pack.tribeFilter] : [];
}

function getNormalizedRarityWeights(input?: Record<CardRarity, number> | null): Record<CardRarity, number> {
    return {
        comum: Math.max(0, Math.trunc(input?.comum ?? 0)),
        incomum: Math.max(0, Math.trunc(input?.incomum ?? 0)),
        rara: Math.max(0, Math.trunc(input?.rara ?? 0)),
        super_rara: Math.max(0, Math.trunc(input?.super_rara ?? 0)),
        ultra_rara: Math.max(0, Math.trunc(input?.ultra_rara ?? 0)),
    };
}

function mapCustomRowToPackConfig(row: SupabaseStorePackRow): StorePackConfig {
    const priceOptions: StorePackPriceOptionDto[] = [];

    if (row.price_coins !== null && row.price_coins > 0) {
        priceOptions.push({ currency: "coins", price: Math.max(0, Math.trunc(row.price_coins)) });
    }

    if (row.price_diamonds !== null && row.price_diamonds > 0) {
        priceOptions.push({ currency: "diamonds", price: Math.max(0, Math.trunc(row.price_diamonds)) });
    }

    return {
        id: `custom:${row.id}`,
        name: row.name,
        description: row.description ?? "Pacote personalizado da loja.",
        imageUrl: getStorePackImagePublicUrl(row.image_file_id) ?? row.image_url,
        currency: priceOptions[0]?.currency ?? "coins",
        price: priceOptions[0]?.price ?? 0,
        priceOptions,
        cardsCount: Math.max(1, Math.trunc(row.cards_count)),
        cardTypes: row.card_types,
        tribeFilter: null,
        allowedTribes: row.allowed_tribes ?? [],
        tribeWeights: row.tribe_weights ?? {},
        guaranteedMinRarity: row.guaranteed_min_rarity,
        guaranteedCount: Math.max(0, Math.trunc(row.guaranteed_count)),
        rarityWeights: getNormalizedRarityWeights(row.rarity_weights),
        dailyLimit: row.daily_limit ?? undefined,
        weeklyLimit: row.weekly_limit ?? undefined,
    };
}

function mapCustomRowToAdminDto(row: SupabaseStorePackRow): AdminStorePackDto {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? "",
        imageFileId: row.image_file_id,
        imageUrl: getStorePackImagePublicUrl(row.image_file_id) ?? row.image_url,
        cardsCount: Math.max(1, Math.trunc(row.cards_count)),
        cardTypes: row.card_types,
        allowedTribes: row.allowed_tribes ?? [],
        tribeWeights: row.tribe_weights ?? {},
        rarityWeights: getNormalizedRarityWeights(row.rarity_weights),
        guaranteedMinRarity: row.guaranteed_min_rarity,
        guaranteedCount: Math.max(0, Math.trunc(row.guaranteed_count)),
        priceCoins: row.price_coins,
        priceDiamonds: row.price_diamonds,
        dailyLimit: row.daily_limit,
        weeklyLimit: row.weekly_limit,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapPackToDto(pack: StorePackConfig, counts: { daily: number; weekly: number }): StorePackDto {
    const priceOptions = getPackPriceOptions(pack);
    const allowedTribes = getPackAllowedTribes(pack);

    const limits: StorePackDto["limits"] = [];

    if (typeof pack.dailyLimit === "number") {
        limits.push({
            window: "daily",
            maxPurchases: pack.dailyLimit,
            remainingPurchases: Math.max(0, pack.dailyLimit - counts.daily),
        });
    }

    if (typeof pack.weeklyLimit === "number") {
        limits.push({
            window: "weekly",
            maxPurchases: pack.weeklyLimit,
            remainingPurchases: Math.max(0, pack.weeklyLimit - counts.weekly),
        });
    }

    return {
        id: pack.id,
        name: pack.name,
        description: pack.description,
        imageUrl: pack.imageUrl ?? null,
        priceOptions,
        currency: priceOptions[0]?.currency ?? pack.currency,
        price: priceOptions[0]?.price ?? pack.price,
        cardsCount: pack.cardsCount,
        cardTypes: pack.cardTypes,
        allowedTribes,
        tribeWeights: pack.tribeWeights ?? {},
        guaranteedMinRarity: pack.guaranteedMinRarity,
        guaranteedCount: pack.guaranteedCount,
        rarityWeights: pack.rarityWeights,
        limits,
    };
}

async function listPurchasesByWindow(userId: string, window: ProgressionEventWindow): Promise<Map<string, number>> {
    const supabase = getSupabaseAdminClient();
    const tableName = getProgressionEventsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("reference_id")
        .eq("user_id", userId)
        .eq("source", STORE_PACK_PURCHASE_SOURCE)
        .gte("created_at", window.startIso)
        .lt("created_at", window.endIso)
        .like("reference_id", "store-pack:%")
        .returns<Array<{ reference_id: string | null }>>();

    if (error) {
        throw new Error(`Erro ao consultar limites de compra da loja: ${error.message}`);
    }

    const counts = new Map<string, number>();

    for (const item of data ?? []) {
        const referenceId = item.reference_id ?? "";
        const packId = referenceId.replace("store-pack:", "");

        if (!packId) {
            continue;
        }

        counts.set(packId, (counts.get(packId) ?? 0) + 1);
    }

    return counts;
}

async function getPackCounts(userId: string, packs: StorePackConfig[], now = new Date()): Promise<Record<string, { daily: number; weekly: number }>> {
    const [dailyMap, weeklyMap] = await Promise.all([
        listPurchasesByWindow(userId, getUtcDayWindow(now)),
        listPurchasesByWindow(userId, getUtcWeekWindow(now)),
    ]);

    const counts: Record<string, { daily: number; weekly: number }> = {};

    for (const pack of packs) {
        counts[pack.id] = {
            daily: dailyMap.get(pack.id) ?? 0,
            weekly: weeklyMap.get(pack.id) ?? 0,
        };
    }

    return counts;
}

function hasRemainingLimit(pack: StorePackDto): boolean {
    return pack.limits.every((limit) => limit.remainingPurchases > 0);
}

async function listCustomStorePackRows(activeOnly: boolean): Promise<SupabaseStorePackRow[]> {
    const supabase = getSupabaseAdminClient();
    const query = supabase
        .from(getStorePacksTableName())
        .select("id,name,description,image_file_id,image_url,cards_count,card_types,allowed_tribes,tribe_weights,rarity_weights,guaranteed_min_rarity,guaranteed_count,price_coins,price_diamonds,daily_limit,weekly_limit,is_active,created_at,updated_at")
        .order("created_at", { ascending: false });

    const { data, error } = await (activeOnly ? query.eq("is_active", true) : query)
        .returns<SupabaseStorePackRow[]>();

    if (error) {
        throw new Error(`Erro ao listar pacotes personalizados da loja: ${error.message}`);
    }

    return data ?? [];
}

async function listStorePackConfigs(): Promise<StorePackConfig[]> {
    const customRows = await listCustomStorePackRows(true);
    return [...STORE_PACKS, ...customRows.map(mapCustomRowToPackConfig)];
}

function normalizeStorePackPayload(payload: CreateAdminStorePackRequestDto | UpdateAdminStorePackRequestDto) {
    const cardTypes = Array.isArray(payload.cardTypes)
        ? [...new Set(payload.cardTypes)].filter(Boolean)
        : undefined;
    const allowedTribes = Array.isArray(payload.allowedTribes)
        ? [...new Set(payload.allowedTribes)].filter(Boolean)
        : undefined;
    const rarityWeights = payload.rarityWeights
        ? getNormalizedRarityWeights(payload.rarityWeights)
        : undefined;

    return {
        name: payload.name?.trim(),
        description: payload.description?.trim() ?? "",
        image_file_id: payload.imageFileId ?? null,
        image_url: null,
        cards_count: payload.cardsCount !== undefined ? Math.max(1, Math.trunc(payload.cardsCount)) : undefined,
        card_types: cardTypes,
        allowed_tribes: allowedTribes ?? [],
        tribe_weights: payload.tribeWeights ?? {},
        rarity_weights: rarityWeights,
        guaranteed_min_rarity: payload.guaranteedMinRarity ?? null,
        guaranteed_count: payload.guaranteedCount !== undefined ? Math.max(0, Math.trunc(payload.guaranteedCount)) : undefined,
        price_coins: payload.priceCoins !== undefined && payload.priceCoins !== null
            ? Math.max(0, Math.trunc(payload.priceCoins))
            : null,
        price_diamonds: payload.priceDiamonds !== undefined && payload.priceDiamonds !== null
            ? Math.max(0, Math.trunc(payload.priceDiamonds))
            : null,
        daily_limit: payload.dailyLimit !== undefined && payload.dailyLimit !== null
            ? Math.max(0, Math.trunc(payload.dailyLimit))
            : null,
        weekly_limit: payload.weeklyLimit !== undefined && payload.weeklyLimit !== null
            ? Math.max(0, Math.trunc(payload.weeklyLimit))
            : null,
        is_active: payload.isActive ?? true,
    };
}

function validateStorePackPayload(input: ReturnType<typeof normalizeStorePackPayload>) {
    if (input.name !== undefined && !input.name) {
        throw new Error("Nome do pacote é obrigatório.");
    }

    if (input.cards_count !== undefined && input.cards_count <= 0) {
        throw new Error("Quantidade de cartas precisa ser maior que zero.");
    }

    if (input.card_types !== undefined && input.card_types.length === 0) {
        throw new Error("Selecione ao menos um tipo de carta.");
    }

    if (input.price_coins !== null && input.price_coins !== undefined && input.price_coins <= 0) {
        throw new Error("Preço em moedas deve ser maior que zero.");
    }

    if (input.price_diamonds !== null && input.price_diamonds !== undefined && input.price_diamonds <= 0) {
        throw new Error("Preço em diamantes deve ser maior que zero.");
    }

    if ((input.price_coins ?? 0) <= 0 && (input.price_diamonds ?? 0) <= 0) {
        throw new Error("Informe ao menos um preço válido: moedas e/ou diamantes.");
    }

    if (input.rarity_weights !== undefined) {
        const total = Object.values(input.rarity_weights).reduce((sum, weight) => sum + Math.max(0, weight), 0);
        if (total <= 0) {
            throw new Error("As probabilidades de raridade precisam ter soma maior que zero.");
        }
    }
}

export async function listAdminStorePacks(): Promise<AdminStorePackDto[]> {
    const rows = await listCustomStorePackRows(false);
    return rows.map(mapCustomRowToAdminDto);
}

export async function createAdminStorePack(payload: CreateAdminStorePackRequestDto): Promise<AdminStorePackDto> {
    const supabase = getSupabaseAdminClient();
    const normalized = normalizeStorePackPayload(payload);

    validateStorePackPayload(normalized);

    const { data, error } = await supabase
        .from(getStorePacksTableName())
        .insert({
            name: normalized.name ?? "",
            description: normalized.description,
            image_file_id: normalized.image_file_id,
            image_url: normalized.image_url,
            cards_count: normalized.cards_count ?? 1,
            card_types: normalized.card_types ?? ["creature"],
            allowed_tribes: normalized.allowed_tribes,
            tribe_weights: normalized.tribe_weights,
            rarity_weights: normalized.rarity_weights ?? getNormalizedRarityWeights(),
            guaranteed_min_rarity: normalized.guaranteed_min_rarity,
            guaranteed_count: normalized.guaranteed_count ?? 0,
            price_coins: normalized.price_coins,
            price_diamonds: normalized.price_diamonds,
            daily_limit: normalized.daily_limit,
            weekly_limit: normalized.weekly_limit,
            is_active: normalized.is_active,
        })
        .select("id,name,description,image_file_id,image_url,cards_count,card_types,allowed_tribes,tribe_weights,rarity_weights,guaranteed_min_rarity,guaranteed_count,price_coins,price_diamonds,daily_limit,weekly_limit,is_active,created_at,updated_at")
        .single<SupabaseStorePackRow>();

    if (error) {
        throw new Error(`Erro ao criar pacote da loja: ${error.message}`);
    }

    return mapCustomRowToAdminDto(data);
}

export async function updateAdminStorePack(packId: string, payload: UpdateAdminStorePackRequestDto): Promise<AdminStorePackDto> {
    const supabase = getSupabaseAdminClient();
    const normalized = normalizeStorePackPayload(payload);

    validateStorePackPayload({
        ...normalized,
        price_coins: normalized.price_coins ?? 1,
    });

    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(normalized)) {
        if (value !== undefined) {
            updateData[key] = value;
        }
    }

    const { data, error } = await supabase
        .from(getStorePacksTableName())
        .update(updateData)
        .eq("id", packId)
        .select("id,name,description,image_file_id,image_url,cards_count,card_types,allowed_tribes,tribe_weights,rarity_weights,guaranteed_min_rarity,guaranteed_count,price_coins,price_diamonds,daily_limit,weekly_limit,is_active,created_at,updated_at")
        .single<SupabaseStorePackRow>();

    if (error) {
        throw new Error(`Erro ao atualizar pacote da loja: ${error.message}`);
    }

    return mapCustomRowToAdminDto(data);
}

export async function deleteAdminStorePack(packId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
        .from(getStorePacksTableName())
        .delete()
        .eq("id", packId);

    if (error) {
        throw new Error(`Erro ao remover pacote da loja: ${error.message}`);
    }
}

function resolveImageUrl(cardType: UserCardType, imageFileId: string | null, imageUrl: string | null) {
    if (!imageFileId) {
        return imageUrl;
    }

    if (cardType === "creature") {
        return getCreatureImagePublicUrl(imageFileId);
    }

    if (cardType === "location") {
        return getLocationImagePublicUrl(imageFileId);
    }

    if (cardType === "mugic") {
        return getMugicImagePublicUrl(imageFileId);
    }

    if (cardType === "battlegear") {
        return getBattlegearImagePublicUrl(imageFileId);
    }

    return getAttackImagePublicUrl(imageFileId);
}

async function fetchPackCardPool(pack: StorePackConfig): Promise<StoreCardPoolItem[]> {
    const supabase = getSupabaseAdminClient();
    const pool: StoreCardPoolItem[] = [];
    const allowedTribes = getPackAllowedTribes(pack);

    const matchesAllowedTribes = (tribes: CreatureTribe[]) => {
        if (allowedTribes.length === 0) {
            return true;
        }

        return tribes.some((tribe) => allowedTribes.includes(tribe));
    };

    if (pack.cardTypes.includes("creature")) {
        const baseQuery = supabase
            .from(getCreaturesTableName())
            .select("id,name,rarity,image_file_id,image_url,tribe");

        const { data, error } = await (pack.tribeFilter
            ? baseQuery.eq("tribe", pack.tribeFilter)
            : baseQuery)
            .returns<Array<{ id: string; name: string; rarity: CardRarity; image_file_id: string | null; image_url: string | null; tribe: CreatureTribe }>>();

        if (error) {
            throw new Error(`Erro ao carregar criaturas da loja: ${error.message}`);
        }

        for (const item of data ?? []) {
            const tribes = [item.tribe];
            if (!matchesAllowedTribes(tribes)) {
                continue;
            }

            pool.push({
                cardType: "creature",
                cardId: item.id,
                rarity: item.rarity,
                cardName: item.name,
                cardImageUrl: resolveImageUrl("creature", item.image_file_id, item.image_url),
                tribes,
            });
        }
    }

    if (pack.cardTypes.includes("location")) {
        const baseQuery = supabase
            .from(getLocationsTableName())
            .select("id,name,rarity,image_file_id,image_url,tribes");

        const { data, error } = await (pack.tribeFilter
            ? baseQuery.contains("tribes", [pack.tribeFilter])
            : baseQuery)
            .returns<Array<{ id: string; name: string; rarity: CardRarity; image_file_id: string | null; image_url: string | null; tribes: CreatureTribe[] }>>();

        if (error) {
            throw new Error(`Erro ao carregar locais da loja: ${error.message}`);
        }

        for (const item of data ?? []) {
            const tribes = item.tribes ?? [];
            if (!matchesAllowedTribes(tribes)) {
                continue;
            }

            pool.push({
                cardType: "location",
                cardId: item.id,
                rarity: item.rarity,
                cardName: item.name,
                cardImageUrl: resolveImageUrl("location", item.image_file_id, item.image_url),
                tribes,
            });
        }
    }

    if (pack.cardTypes.includes("mugic")) {
        const baseQuery = supabase
            .from(getMugicTableName())
            .select("id,name,rarity,image_file_id,image_url,tribes");

        const { data, error } = await (pack.tribeFilter
            ? baseQuery.contains("tribes", [pack.tribeFilter])
            : baseQuery)
            .returns<Array<{ id: string; name: string; rarity: CardRarity; image_file_id: string | null; image_url: string | null; tribes: CreatureTribe[] }>>();

        if (error) {
            throw new Error(`Erro ao carregar mugic da loja: ${error.message}`);
        }

        for (const item of data ?? []) {
            const tribes = item.tribes ?? [];
            if (!matchesAllowedTribes(tribes)) {
                continue;
            }

            pool.push({
                cardType: "mugic",
                cardId: item.id,
                rarity: item.rarity,
                cardName: item.name,
                cardImageUrl: resolveImageUrl("mugic", item.image_file_id, item.image_url),
                tribes,
            });
        }
    }

    if (pack.cardTypes.includes("battlegear")) {
        const baseQuery = supabase
            .from(getBattlegearTableName())
            .select("id,name,rarity,image_file_id,image_url,allowed_tribes");

        const { data, error } = await (pack.tribeFilter
            ? baseQuery.contains("allowed_tribes", [pack.tribeFilter])
            : baseQuery)
            .returns<Array<{ id: string; name: string; rarity: CardRarity; image_file_id: string | null; image_url: string | null; allowed_tribes: CreatureTribe[] }>>();

        if (error) {
            throw new Error(`Erro ao carregar battlegear da loja: ${error.message}`);
        }

        for (const item of data ?? []) {
            const tribes = item.allowed_tribes ?? [];
            if (!matchesAllowedTribes(tribes)) {
                continue;
            }

            pool.push({
                cardType: "battlegear",
                cardId: item.id,
                rarity: item.rarity,
                cardName: item.name,
                cardImageUrl: resolveImageUrl("battlegear", item.image_file_id, item.image_url),
                tribes,
            });
        }
    }

    if (pack.cardTypes.includes("attack") && !pack.tribeFilter) {
        const { data, error } = await supabase
            .from(getAttacksTableName())
            .select("id,name,rarity,image_file_id,image_url")
            .returns<Array<{ id: string; name: string; rarity: CardRarity; image_file_id: string | null; image_url: string | null }>>();

        if (error) {
            throw new Error(`Erro ao carregar ataques da loja: ${error.message}`);
        }

        for (const item of data ?? []) {
            pool.push({
                cardType: "attack",
                cardId: item.id,
                rarity: item.rarity,
                cardName: item.name,
                cardImageUrl: resolveImageUrl("attack", item.image_file_id, item.image_url),
                tribes: [],
            });
        }
    }

    return pool;
}

function pickCardFromPool(input: {
    pool: StoreCardPoolItem[];
    allowedTypes: UserCardType[];
    desiredRarity: CardRarity;
    minRarity: CardRarity | null;
    desiredTribe: CreatureTribe | null;
    usedKeys: Set<string>;
    allowDuplicates: boolean;
}): StoreCardPoolItem | null {
    const minRank = input.minRarity ? getRarityRank(input.minRarity) : -1;
    const desiredRank = Math.max(minRank, getRarityRank(input.desiredRarity));

    const fallbackRanks = [
        ...RARITY_ORDER.slice(desiredRank).map(getRarityRank),
        ...RARITY_ORDER.slice(minRank >= 0 ? minRank : 0, desiredRank).reverse().map(getRarityRank),
    ];

    const uniqueRanks = [...new Set(fallbackRanks)];

    for (const rank of uniqueRanks) {
        const rarity = RARITY_ORDER[rank];

        const candidates = input.pool.filter((card) => {
            if (card.rarity !== rarity) {
                return false;
            }

            if (!input.allowedTypes.includes(card.cardType)) {
                return false;
            }

            if (input.desiredTribe && card.tribes.length > 0 && !card.tribes.includes(input.desiredTribe)) {
                return false;
            }

            if (input.allowDuplicates) {
                return true;
            }

            const key = `${card.cardType}:${card.cardId}`;
            return !input.usedKeys.has(key);
        });

        if (candidates.length === 0) {
            continue;
        }

        return randomItem(candidates);
    }

    return null;
}

function rollTribe(weights: Partial<Record<CreatureTribe, number>>, fallbackTribes: CreatureTribe[]): CreatureTribe | null {
    const candidates = fallbackTribes.map((tribe) => ({
        tribe,
        weight: Math.max(0, Math.trunc(weights[tribe] ?? 0)),
    }));
    const total = candidates.reduce((sum, item) => sum + item.weight, 0);

    if (total <= 0) {
        return fallbackTribes[0] ?? null;
    }

    let cursor = Math.random() * total;
    for (const item of candidates) {
        cursor -= item.weight;
        if (cursor <= 0) {
            return item.tribe;
        }
    }

    return fallbackTribes[0] ?? null;
}

async function listOwnedCardKeys(userId: string): Promise<Set<string>> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
        .from(getUserCardsTableName())
        .select("card_type,card_id")
        .eq("user_id", userId)
        .returns<Array<{ card_type: UserCardType; card_id: string }>>();

    if (error) {
        throw new Error(`Erro ao consultar coleção atual do usuário: ${error.message}`);
    }

    return new Set((data ?? []).map((item) => `${item.card_type}:${item.card_id}`));
}

function aggregateAwards(cards: StoreRevealCardDto[]) {
    const map = new Map<string, { cardType: UserCardType; cardId: string; rarity: CardRarity; quantity: number }>();

    for (const card of cards) {
        const key = `${card.cardType}:${card.cardId}`;
        const current = map.get(key);

        if (current) {
            current.quantity += 1;
            continue;
        }

        map.set(key, {
            cardType: card.cardType,
            cardId: card.cardId,
            rarity: card.rarity,
            quantity: 1,
        });
    }

    return [...map.values()];
}

async function buildPackDraw(pack: StorePackConfig, userId: string): Promise<StoreRevealCardDto[]> {
    const [pool, ownedKeys] = await Promise.all([
        fetchPackCardPool(pack),
        listOwnedCardKeys(userId),
    ]);

    if (pool.length === 0) {
        throw new Error("Este pacote está sem cartas elegíveis no momento.");
    }

    const usedKeys = new Set<string>();
    const cards: StoreRevealCardDto[] = [];
    let guaranteedRemaining = pack.guaranteedCount;
    const allowedTribes = getPackAllowedTribes(pack);

    for (let index = 0; index < pack.cardsCount; index += 1) {
        const remainingSlots = pack.cardsCount - index;
        const forceGuaranteed = Boolean(pack.guaranteedMinRarity) && guaranteedRemaining >= remainingSlots;
        const desiredRarity = rollRarity(pack.rarityWeights);
        const desiredTribe = rollTribe(pack.tribeWeights ?? {}, allowedTribes);

        const selected = pickCardFromPool({
            pool,
            allowedTypes: pack.cardTypes,
            desiredRarity,
            minRarity: forceGuaranteed ? pack.guaranteedMinRarity : null,
            desiredTribe,
            usedKeys,
            allowDuplicates: false,
        }) ?? pickCardFromPool({
            pool,
            allowedTypes: pack.cardTypes,
            desiredRarity,
            minRarity: forceGuaranteed ? pack.guaranteedMinRarity : null,
            desiredTribe,
            usedKeys,
            allowDuplicates: true,
        });

        if (!selected) {
            throw new Error("Não foi possível montar o pacote com as cartas disponíveis.");
        }

        const cardKey = `${selected.cardType}:${selected.cardId}`;
        usedKeys.add(cardKey);

        if (pack.guaranteedMinRarity && getRarityRank(selected.rarity) >= getRarityRank(pack.guaranteedMinRarity)) {
            guaranteedRemaining = Math.max(0, guaranteedRemaining - 1);
        }

        const sellValue = await getCardSellValue(selected.cardType, selected.rarity, selected.cardId);

        cards.push({
            cardType: selected.cardType,
            cardId: selected.cardId,
            rarity: selected.rarity,
            cardName: selected.cardName,
            cardImageUrl: selected.cardImageUrl,
            isDuplicateInCollection: ownedKeys.has(cardKey),
            sellValue,
        });
    }

    if (pack.guaranteedMinRarity && guaranteedRemaining > 0) {
        throw new Error("Não há cartas suficientes para garantir a raridade mínima deste pacote.");
    }

    return cards;
}

export async function sellStoreCards(
    userId: string,
    cards: StoreSellCardInputDto[],
): Promise<{ soldCount: number; coinsEarned: number; progression: UserProgressionDto; wallet: { coins: number; diamonds: number } }> {
    const normalized = cards
        .map((card) => ({
            cardType: card.cardType,
            cardId: card.cardId,
            quantity: Math.max(1, Math.trunc(card.quantity ?? 1)),
        }))
        .filter((card) => Boolean(card.cardId));

    if (normalized.length === 0) {
        throw new Error("Informe ao menos uma carta para vender.");
    }

    const aggregated = new Map<string, { cardType: UserCardType; cardId: string; quantity: number }>();

    for (const card of normalized) {
        const key = `${card.cardType}:${card.cardId}`;
        const current = aggregated.get(key);

        if (current) {
            current.quantity += card.quantity;
            continue;
        }

        aggregated.set(key, { ...card });
    }

    let soldCount = 0;
    let coinsEarned = 0;
    let lastProgression: UserProgressionDto | null = null;
    let lastWallet: { coins: number; diamonds: number } | null = null;

    for (const card of aggregated.values()) {
        const result = await discardUserCardByReference(userId, card.cardType, card.cardId, card.quantity);

        soldCount += card.quantity;
        coinsEarned += result.coinsEarned;
        lastProgression = result.progression;
        lastWallet = result.wallet;
    }

    if (!lastProgression || !lastWallet) {
        throw new Error("Não foi possível concluir a venda das cartas.");
    }

    return {
        soldCount,
        coinsEarned,
        progression: lastProgression,
        wallet: lastWallet,
    };
}

export async function listStorePacksForUser(userId: string): Promise<{ packs: StorePackDto[]; wallet: { coins: number; diamonds: number } }> {
    const configs = await listStorePackConfigs();

    const [counts, wallet] = await Promise.all([
        getPackCounts(userId, configs),
        ensureUserWalletInSupabase(userId),
    ]);

    return {
        packs: configs.map((pack) => mapPackToDto(pack, counts[pack.id] ?? { daily: 0, weekly: 0 })),
        wallet: {
            coins: wallet.coins,
            diamonds: wallet.diamonds,
        },
    };
}

export async function purchaseStorePack(userId: string, packId: string, requestedCurrency?: StoreCurrency): Promise<{
    packId: string;
    cards: StoreRevealCardDto[];
    progression: UserProgressionDto;
    wallet: { coins: number; diamonds: number };
}> {
    const configs = await listStorePackConfigs();
    const pack = configs.find((item) => item.id === packId);

    if (!pack) {
        throw new Error("Pacote não encontrado.");
    }

    const listResult = await listStorePacksForUser(userId);
    const wallet = await ensureUserWalletInSupabase(userId);
    const packWithLimits = listResult.packs.find((item) => item.id === packId);

    if (!packWithLimits || !hasRemainingLimit(packWithLimits)) {
        throw new Error("Limite de compra deste pacote foi atingido para o período atual.");
    }

    const priceOptions = getPackPriceOptions(pack);
    const selectedPrice = requestedCurrency
        ? priceOptions.find((option) => option.currency === requestedCurrency)
        : priceOptions[0];

    if (!selectedPrice) {
        throw new Error("Este pacote não possui preço disponível para a moeda selecionada.");
    }

    if (selectedPrice.currency === "coins" && wallet.coins < selectedPrice.price) {
        throw new Error("Saldo insuficiente de moedas para comprar este pacote.");
    }

    if (selectedPrice.currency === "diamonds" && wallet.diamonds < selectedPrice.price) {
        throw new Error("Saldo insuficiente de diamantes para comprar este pacote.");
    }

    const drawnCards = await buildPackDraw(pack, userId);

    const purchaseEvent = await applyProgressionEvent({
        userId,
        source: STORE_PACK_PURCHASE_SOURCE,
        xpDelta: 0,
        coinsDelta: selectedPrice.currency === "coins" ? -selectedPrice.price : 0,
        diamondsDelta: selectedPrice.currency === "diamonds" ? -selectedPrice.price : 0,
        referenceId: `store-pack:${pack.id}`,
        metadata: {
            rule: "store_pack_purchase",
            packId: pack.id,
            currency: selectedPrice.currency,
            price: selectedPrice.price,
            cardsCount: pack.cardsCount,
        },
    });

    const aggregatedAwards = aggregateAwards(drawnCards);

    try {
        let progression = purchaseEvent.progression;
        let walletState = purchaseEvent.wallet;

        for (const award of aggregatedAwards) {
            const awardResult = await registerCardAward({
                userId,
                cardType: award.cardType,
                cardId: award.cardId,
                rarity: award.rarity,
                quantity: award.quantity,
                referenceId: `store-pack:${pack.id}`,
            });

            progression = awardResult.progression;
            walletState = awardResult.wallet;
        }

        return {
            packId: pack.id,
            cards: drawnCards,
            progression,
            wallet: walletState,
        };
    } catch (error) {
        await applyProgressionEvent({
            userId,
            source: STORE_PACK_REFUND_SOURCE,
            xpDelta: 0,
            coinsDelta: selectedPrice.currency === "coins" ? selectedPrice.price : 0,
            diamondsDelta: selectedPrice.currency === "diamonds" ? selectedPrice.price : 0,
            referenceId: `store-pack-refund:${pack.id}`,
            metadata: {
                rule: "store_pack_refund",
                packId: pack.id,
                currency: selectedPrice.currency,
                price: selectedPrice.price,
                reason: "award_failure",
            },
        });

        throw new Error(error instanceof Error
            ? `Falha ao conceder cartas do pacote. A cobrança foi estornada. Detalhe: ${error.message}`
            : "Falha ao conceder cartas do pacote. A cobrança foi estornada.");
    }
}
