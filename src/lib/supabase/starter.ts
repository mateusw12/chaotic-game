import type { CardRarity, CreatureTribe } from "@/dto/creature";
import {
    STARTER_TRIBE_OPTIONS,
    type StarterRewardPackDto,
    type StarterSelectableTribe,
    type UserCardType,
    type UserProgressionDto,
} from "@/dto/progression";
import {
    getAttacksTableName,
    getBattlegearTableName,
    getCreaturesTableName,
    getLocationsTableName,
    getMugicTableName,
    getUserCardsTableName,
    getUsersTableName,
} from "./core";
import { applyProgressionEvent, registerCardAward } from "./progression";
import { ensureUserWalletInSupabase } from "./wallets";
import { getSupabaseAdminClient } from "./storage";

const STARTER_PACK_OPEN_XP = 10;

type StarterCardPoolItem = {
    cardType: UserCardType;
    cardId: string;
    rarity: CardRarity;
};

type StarterStatus = {
    selectedTribe: CreatureTribe | null;
    rewardGrantedAt: string | null;
    hasDeck: boolean;
};

function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function drawCards(pool: StarterCardPoolItem[], count: number): StarterCardPoolItem[] {
    if (count <= 0) {
        return [];
    }

    if (pool.length === 0) {
        throw new Error("Não há cartas suficientes para montar o pacote inicial.");
    }

    const selected: StarterCardPoolItem[] = [];
    const usedIndexes = new Set<number>();

    while (selected.length < count) {
        if (usedIndexes.size === pool.length) {
            selected.push(randomItem(pool));
            continue;
        }

        const index = Math.floor(Math.random() * pool.length);

        if (usedIndexes.has(index)) {
            continue;
        }

        usedIndexes.add(index);
        selected.push(pool[index]);
    }

    return selected;
}

async function fetchStarterStatus(userId: string): Promise<StarterStatus> {
    const supabase = getSupabaseAdminClient();

    const [{ data, error }, { count, error: deckCountError }] = await Promise.all([
        supabase
            .from(getUsersTableName())
            .select("starter_tribe,starter_reward_granted_at")
            .eq("id", userId)
            .maybeSingle<{ starter_tribe: CreatureTribe | null; starter_reward_granted_at: string | null }>(),
        supabase
            .from(getUserCardsTableName())
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
    ]);

    if (error) {
        throw new Error(`Erro ao consultar status inicial do usuário: ${error.message}`);
    }

    if (deckCountError) {
        throw new Error(`Erro ao consultar deck inicial do usuário: ${deckCountError.message}`);
    }

    return {
        selectedTribe: data?.starter_tribe ?? null,
        rewardGrantedAt: data?.starter_reward_granted_at ?? null,
        hasDeck: (count ?? 0) > 0,
    };
}

async function loadCreaturesByTribe(tribe: StarterSelectableTribe): Promise<StarterCardPoolItem[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
        .from(getCreaturesTableName())
        .select("id,rarity")
        .eq("tribe", tribe)
        .returns<Array<{ id: string; rarity: CardRarity }>>();

    if (error) {
        throw new Error(`Erro ao carregar criaturas iniciais: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
        cardType: "creature",
        cardId: item.id,
        rarity: item.rarity,
    }));
}

async function loadMugicAndBattlegear(): Promise<StarterCardPoolItem[]> {
    const supabase = getSupabaseAdminClient();

    const [{ data: mugicData, error: mugicError }, { data: battlegearData, error: battlegearError }] = await Promise.all([
        supabase
            .from(getMugicTableName())
            .select("id,rarity")
            .returns<Array<{ id: string; rarity: CardRarity }>>(),
        supabase
            .from(getBattlegearTableName())
            .select("id,rarity")
            .returns<Array<{ id: string; rarity: CardRarity }>>(),
    ]);

    if (mugicError) {
        throw new Error(`Erro ao carregar mugic inicial: ${mugicError.message}`);
    }

    if (battlegearError) {
        throw new Error(`Erro ao carregar equipamentos iniciais: ${battlegearError.message}`);
    }

    return [
        ...(mugicData ?? []).map((item) => ({ cardType: "mugic" as const, cardId: item.id, rarity: item.rarity })),
        ...(battlegearData ?? []).map((item) => ({ cardType: "battlegear" as const, cardId: item.id, rarity: item.rarity })),
    ];
}

async function loadLocationsAndAttacks(tribe: StarterSelectableTribe): Promise<{
    tribeLocations: StarterCardPoolItem[];
    attacks: StarterCardPoolItem[];
}> {
    const supabase = getSupabaseAdminClient();

    const [{ data: locationsData, error: locationsError }, { data: attacksData, error: attacksError }] = await Promise.all([
        supabase
            .from(getLocationsTableName())
            .select("id,rarity,tribes")
            .contains("tribes", [tribe])
            .returns<Array<{ id: string; rarity: CardRarity; tribes: CreatureTribe[] }>>(),
        supabase
            .from(getAttacksTableName())
            .select("id,rarity")
            .returns<Array<{ id: string; rarity: CardRarity }>>(),
    ]);

    if (locationsError) {
        throw new Error(`Erro ao carregar locais iniciais: ${locationsError.message}`);
    }

    if (attacksError) {
        throw new Error(`Erro ao carregar ataques iniciais: ${attacksError.message}`);
    }

    return {
        tribeLocations: (locationsData ?? []).map((item) => ({ cardType: "location", cardId: item.id, rarity: item.rarity })),
        attacks: (attacksData ?? []).map((item) => ({ cardType: "attack", cardId: item.id, rarity: item.rarity })),
    };
}

function aggregateAwards(packs: StarterRewardPackDto[]) {
    const map = new Map<string, { cardType: UserCardType; cardId: string; rarity: CardRarity; quantity: number }>();

    for (const pack of packs) {
        for (const card of pack.cards) {
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
    }

    return [...map.values()];
}

async function markStarterChoice(userId: string, tribe: StarterSelectableTribe): Promise<void> {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
        .from(getUsersTableName())
        .update({
            starter_tribe: tribe,
            starter_reward_granted_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) {
        throw new Error(`Erro ao salvar tribo inicial escolhida: ${error.message}`);
    }
}

export async function getStarterProgressionStatus(userId: string): Promise<{
    requiresChoice: boolean;
    selectedTribe: CreatureTribe | null;
    allowedTribes: StarterSelectableTribe[];
}> {
    const status = await fetchStarterStatus(userId);
    const requiresChoice = !status.selectedTribe || (!status.hasDeck && !status.rewardGrantedAt);

    return {
        requiresChoice,
        selectedTribe: status.selectedTribe,
        allowedTribes: [...STARTER_TRIBE_OPTIONS],
    };
}

export async function chooseStarterTribeAndGrantRewards(userId: string, tribe: StarterSelectableTribe): Promise<{
    selectedTribe: StarterSelectableTribe;
    packs: StarterRewardPackDto[];
    progression: UserProgressionDto;
    wallet: {
        coins: number;
        diamonds: number;
    };
}> {
    const currentStatus = await fetchStarterStatus(userId);

    if (currentStatus.rewardGrantedAt || currentStatus.hasDeck) {
        throw new Error("A tribo inicial já foi escolhida para este usuário.");
    }

    if (currentStatus.selectedTribe && currentStatus.selectedTribe !== tribe) {
        throw new Error("A tribo inicial já está definida para este usuário. Continue com a tribo salva.");
    }

    const selectedTribe = currentStatus.selectedTribe ?? tribe;

    const [creaturesPool, mugicBattlegearPool, locationsAndAttacks] = await Promise.all([
        loadCreaturesByTribe(selectedTribe),
        loadMugicAndBattlegear(),
        loadLocationsAndAttacks(selectedTribe),
    ]);

    const creaturesPack: StarterRewardPackDto = {
        id: "starter_tribe_creatures",
        cards: drawCards(creaturesPool, 10),
    };

    const supportPack: StarterRewardPackDto = {
        id: "starter_mugic_battlegear",
        cards: drawCards(mugicBattlegearPool, 5),
    };

    const locationsCount = Math.min(3, locationsAndAttacks.tribeLocations.length, 10);
    const attacksCount = 10 - locationsCount;

    if (attacksCount > 0 && locationsAndAttacks.attacks.length === 0) {
        throw new Error("Não há ataques suficientes para montar o pacote inicial de locais e ataques.");
    }

    const tacticalPack: StarterRewardPackDto = {
        id: "starter_locations_attacks",
        cards: [
            ...drawCards(locationsAndAttacks.tribeLocations, locationsCount),
            ...drawCards(locationsAndAttacks.attacks, attacksCount),
        ],
    };

    const allPacks = [creaturesPack, supportPack, tacticalPack];
    const awards = aggregateAwards(allPacks);

    let progression: UserProgressionDto | null = null;
    let wallet = await ensureUserWalletInSupabase(userId).then((item) => ({ coins: item.coins, diamonds: item.diamonds }));

    for (const pack of allPacks) {
        const event = await applyProgressionEvent({
            userId,
            source: "starter_pack_opened",
            xpDelta: STARTER_PACK_OPEN_XP,
            referenceId: `starter-pack:${pack.id}`,
            metadata: {
                rule: "starter_pack_opened",
                packId: pack.id,
                xp: STARTER_PACK_OPEN_XP,
                cardsCount: pack.cards.length,
                tribe: selectedTribe,
            },
        });

        progression = event.progression;
        wallet = event.wallet;
    }

    for (const award of awards) {
        const result = await registerCardAward({
            userId,
            cardType: award.cardType,
            cardId: award.cardId,
            rarity: award.rarity,
            quantity: award.quantity,
            referenceId: `starter-tribe:${selectedTribe}`,
        });

        progression = result.progression;
        wallet = result.wallet;
    }

    if (!progression) {
        throw new Error("Não foi possível atualizar a progressão do pacote inicial.");
    }

    await markStarterChoice(userId, selectedTribe);

    return {
        selectedTribe,
        packs: allPacks,
        progression,
        wallet,
    };
}
