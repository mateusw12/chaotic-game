import type {
    CreateDeckRequestDto,
    DeckCollectionCardDto,
    DeckDto,
    DeckOverviewDto,
    UpdateDeckRequestDto,
} from "@/dto/deck";
import type { CreatureTribe } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";
import {
    getAttacksTableName,
    getBattlegearTableName,
    getCreaturesTableName,
    getLocationsTableName,
    getMugicTableName,
    getUserCardsTableName,
    getUserDeckCardsTableName,
    getUserDecksTableName,
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
    SupabaseUserCardRow,
    SupabaseUserDeckCardRow,
    SupabaseUserDeckRow,
} from "./types";
import { getCardSellValue } from "./progression";

const CARD_FALLBACK_IMAGE = "/assets/card/verso.png";

type CardMeta = {
    name: string;
    imageUrl: string;
    energy: number;
    primaryTribe: CreatureTribe | null;
};

function mapDeck(deck: SupabaseUserDeckRow, cards: SupabaseUserDeckCardRow[]): DeckDto {
    return {
        id: deck.id,
        name: deck.name,
        cards: cards.map((card) => ({
            cardType: card.card_type,
            cardId: card.card_id,
            quantity: card.quantity,
        })),
        createdAt: deck.created_at,
        updatedAt: deck.updated_at,
    };
}

function mapCollectionCard(row: SupabaseUserCardRow, meta: CardMeta, sellValue: number): DeckCollectionCardDto {
    return {
        userCardId: row.id,
        cardType: row.card_type,
        cardId: row.card_id,
        name: meta.name,
        imageUrl: meta.imageUrl,
        rarity: row.rarity,
        quantity: row.quantity,
        energy: meta.energy,
        primaryTribe: meta.primaryTribe,
        sellValue,
    };
}

async function resolveCardsMetadata(rows: SupabaseUserCardRow[]): Promise<Map<string, CardMeta>> {
    const supabase = getSupabaseAdminClient();
    const groupedByType = new Map<UserCardType, string[]>();

    for (const row of rows) {
        const list = groupedByType.get(row.card_type) ?? [];
        list.push(row.card_id);
        groupedByType.set(row.card_type, list);
    }

    const result = new Map<string, CardMeta>();

    const creatureIds = groupedByType.get("creature") ?? [];
    if (creatureIds.length > 0) {
        const { data } = await supabase
            .from(getCreaturesTableName())
            .select("id,name,tribe,energy,image_file_id,image_url")
            .in("id", creatureIds)
            .returns<Array<{ id: string; name: string; tribe: CreatureTribe; energy: number; image_file_id: string | null; image_url: string | null }>>();

        for (const row of data ?? []) {
            result.set(`creature:${row.id}`, {
                name: row.name,
                imageUrl: row.image_file_id ? (getCreatureImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
                energy: row.energy,
                primaryTribe: row.tribe,
            });
        }
    }

    const locationIds = groupedByType.get("location") ?? [];
    if (locationIds.length > 0) {
        const { data } = await supabase
            .from(getLocationsTableName())
            .select("id,name,tribes,image_file_id,image_url")
            .in("id", locationIds)
            .returns<Array<{ id: string; name: string; tribes: CreatureTribe[]; image_file_id: string | null; image_url: string | null }>>();

        for (const row of data ?? []) {
            result.set(`location:${row.id}`, {
                name: row.name,
                imageUrl: row.image_file_id ? (getLocationImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
                energy: 0,
                primaryTribe: row.tribes?.[0] ?? null,
            });
        }
    }

    const mugicIds = groupedByType.get("mugic") ?? [];
    if (mugicIds.length > 0) {
        const { data } = await supabase
            .from(getMugicTableName())
            .select("id,name,tribes,cost,image_file_id,image_url")
            .in("id", mugicIds)
            .returns<Array<{ id: string; name: string; tribes: CreatureTribe[]; cost: number; image_file_id: string | null; image_url: string | null }>>();

        for (const row of data ?? []) {
            result.set(`mugic:${row.id}`, {
                name: row.name,
                imageUrl: row.image_file_id ? (getMugicImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
                energy: row.cost,
                primaryTribe: row.tribes?.[0] ?? null,
            });
        }
    }

    const battlegearIds = groupedByType.get("battlegear") ?? [];
    if (battlegearIds.length > 0) {
        const { data } = await supabase
            .from(getBattlegearTableName())
            .select("id,name,allowed_tribes,image_file_id,image_url")
            .in("id", battlegearIds)
            .returns<Array<{ id: string; name: string; allowed_tribes: CreatureTribe[]; image_file_id: string | null; image_url: string | null }>>();

        for (const row of data ?? []) {
            result.set(`battlegear:${row.id}`, {
                name: row.name,
                imageUrl: row.image_file_id ? (getBattlegearImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
                energy: 0,
                primaryTribe: row.allowed_tribes?.[0] ?? null,
            });
        }
    }

    const attackIds = groupedByType.get("attack") ?? [];
    if (attackIds.length > 0) {
        const { data } = await supabase
            .from(getAttacksTableName())
            .select("id,name,energy_cost,image_file_id,image_url")
            .in("id", attackIds)
            .returns<Array<{ id: string; name: string; energy_cost: number; image_file_id: string | null; image_url: string | null }>>();

        for (const row of data ?? []) {
            result.set(`attack:${row.id}`, {
                name: row.name,
                imageUrl: row.image_file_id ? (getAttackImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
                energy: row.energy_cost,
                primaryTribe: null,
            });
        }
    }

    for (const row of rows) {
        const key = `${row.card_type}:${row.card_id}`;
        if (!result.has(key)) {
            result.set(key, {
                name: "Carta sem nome",
                imageUrl: CARD_FALLBACK_IMAGE,
                energy: 0,
                primaryTribe: null,
            });
        }
    }

    return result;
}

export async function getUserDeckOverview(userId: string): Promise<DeckOverviewDto> {
    const supabase = getSupabaseAdminClient();

    const { data: collectionRows, error: collectionError } = await supabase
        .from(getUserCardsTableName())
        .select("id,user_id,card_type,card_id,rarity,quantity,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .returns<SupabaseUserCardRow[]>();

    if (collectionError) {
        throw new Error(`Erro ao carregar coleção do usuário: ${collectionError.message}`);
    }

    const { data: deckRows, error: decksError } = await supabase
        .from(getUserDecksTableName())
        .select("id,user_id,name,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .returns<SupabaseUserDeckRow[]>();

    if (decksError) {
        const supabaseError = decksError as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${getUserDecksTableName()}. Aplique o schema atualizado para usar decks.`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    const deckIds = (deckRows ?? []).map((row) => row.id);
    let deckCardRows: SupabaseUserDeckCardRow[] = [];

    if (deckIds.length > 0) {
        const { data: cardsData, error: deckCardsError } = await supabase
            .from(getUserDeckCardsTableName())
            .select("id,deck_id,card_type,card_id,quantity,created_at,updated_at")
            .in("deck_id", deckIds)
            .returns<SupabaseUserDeckCardRow[]>();

        if (deckCardsError) {
            const supabaseError = deckCardsError as SupabaseApiError;
            if (isMissingTableError(supabaseError)) {
                throw new Error(`Tabela não encontrada no Supabase: public.${getUserDeckCardsTableName()}. Aplique o schema atualizado para usar decks.`);
            }
            throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
        }

        deckCardRows = cardsData ?? [];
    }

    const metadataMap = await resolveCardsMetadata(collectionRows ?? []);

    const collection = await Promise.all((collectionRows ?? []).map(async (row) => {
        const key = `${row.card_type}:${row.card_id}`;
        const meta = metadataMap.get(key) ?? {
            name: "Carta sem nome",
            imageUrl: CARD_FALLBACK_IMAGE,
            energy: 0,
            primaryTribe: null,
        };

        const sellValue = await getCardSellValue(row.card_type, row.rarity, row.card_id);

        return mapCollectionCard(row, meta, sellValue);
    }));

    const decks = (deckRows ?? []).map((deckRow) => {
        const cards = deckCardRows.filter((entry) => entry.deck_id === deckRow.id);
        return mapDeck(deckRow, cards);
    });

    return {
        collection,
        decks,
    };
}

export async function createUserDeck(userId: string, payload: CreateDeckRequestDto): Promise<DeckDto> {
    const name = payload.name.trim();

    if (!name) {
        throw new Error("Nome do deck é obrigatório.");
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
        .from(getUserDecksTableName())
        .insert({ user_id: userId, name })
        .select("id,user_id,name,created_at,updated_at")
        .single<SupabaseUserDeckRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${getUserDecksTableName()}. Aplique o schema atualizado para usar decks.`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return {
        id: data.id,
        name: data.name,
        cards: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

export async function updateUserDeck(userId: string, deckId: string, payload: UpdateDeckRequestDto): Promise<DeckDto> {
    const supabase = getSupabaseAdminClient();

    const { data: deck, error: deckError } = await supabase
        .from(getUserDecksTableName())
        .select("id,user_id,name,created_at,updated_at")
        .eq("id", deckId)
        .eq("user_id", userId)
        .maybeSingle<SupabaseUserDeckRow>();

    if (deckError) {
        throw new Error(`Erro ao validar deck: ${deckError.message}`);
    }

    if (!deck) {
        throw new Error("Deck não encontrado.");
    }

    let nextDeck = deck;

    if (payload.name !== undefined) {
        const name = payload.name.trim();
        if (!name) {
            throw new Error("Nome do deck é obrigatório.");
        }

        const { data: updatedDeck, error: updateError } = await supabase
            .from(getUserDecksTableName())
            .update({ name, updated_at: new Date().toISOString() })
            .eq("id", deckId)
            .eq("user_id", userId)
            .select("id,user_id,name,created_at,updated_at")
            .single<SupabaseUserDeckRow>();

        if (updateError) {
            throw new Error(`Erro ao atualizar deck: ${updateError.message}`);
        }

        nextDeck = updatedDeck;
    }

    if (payload.cards) {
        const normalizedCards = payload.cards
            .map((item) => ({
                card_type: item.cardType,
                card_id: item.cardId,
                quantity: Math.max(0, Math.trunc(item.quantity)),
            }))
            .filter((item) => item.quantity > 0);

        const { error: deleteError } = await supabase
            .from(getUserDeckCardsTableName())
            .delete()
            .eq("deck_id", deckId);

        if (deleteError) {
            throw new Error(`Erro ao atualizar cartas do deck: ${deleteError.message}`);
        }

        if (normalizedCards.length > 0) {
            const { error: insertError } = await supabase
                .from(getUserDeckCardsTableName())
                .insert(normalizedCards.map((item) => ({ ...item, deck_id: deckId })));

            if (insertError) {
                throw new Error(`Erro ao salvar cartas do deck: ${insertError.message}`);
            }
        }
    }

    const { data: cards, error: cardsError } = await supabase
        .from(getUserDeckCardsTableName())
        .select("id,deck_id,card_type,card_id,quantity,created_at,updated_at")
        .eq("deck_id", deckId)
        .returns<SupabaseUserDeckCardRow[]>();

    if (cardsError) {
        throw new Error(`Erro ao listar cartas do deck: ${cardsError.message}`);
    }

    return mapDeck(nextDeck, cards ?? []);
}

export async function deleteUserDeck(userId: string, deckId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
        .from(getUserDecksTableName())
        .delete()
        .eq("id", deckId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Erro ao remover deck: ${error.message}`);
    }
}
