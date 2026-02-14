import type { CardRarity, CreatureTribe } from "@/dto/creature";

export const USER_CARD_TYPES = ["creature", "location", "mugic", "battlegear", "attack"] as const;

export type UserCardType = (typeof USER_CARD_TYPES)[number];

export const PROGRESSION_EVENT_SOURCES = [
    "battle_victory",
    "card_awarded",
    "card_discarded",
    "daily_login",
    "shop_pack_purchase",
    "shop_purchase_refund",
    "starter_pack_opened",
] as const;

export const STARTER_TRIBE_OPTIONS = ["overworld", "underworld", "mipedian", "danian"] as const;

export type StarterSelectableTribe = (typeof STARTER_TRIBE_OPTIONS)[number];

export type ProgressionEventSource = (typeof PROGRESSION_EVENT_SOURCES)[number];

export type UserProgressionDto = {
    id: string;
    userId: string;
    xpTotal: number;
    level: number;
    xpCurrentLevel: number;
    xpNextLevel: number;
    seasonRank: string;
    createdAt: string;
    updatedAt: string;
};

export type UserCardInventoryItemDto = {
    id: string;
    userId: string;
    cardType: UserCardType;
    cardId: string;
    cardName: string | null;
    cardImageUrl: string | null;
    rarity: CardRarity;
    quantity: number;
    createdAt: string;
    updatedAt: string;
};

export type ProgressionEventDto = {
    id: string;
    userId: string;
    source: ProgressionEventSource;
    xpDelta: number;
    coinsDelta: number;
    diamondsDelta: number;
    cardType: UserCardType | null;
    cardId: string | null;
    cardRarity: CardRarity | null;
    quantity: number;
    referenceId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
};

export type UserProgressionOverviewDto = {
    progression: UserProgressionDto;
    inventory: UserCardInventoryItemDto[];
    recentEvents: ProgressionEventDto[];
    coins: number;
    diamonds: number;
    stats: UserProgressionStatsDto;
};

export type UserProgressionStatsDto = {
    score: number;
    victories: number;
    defeats: number;
    totalCards: number;
    locationCards: number;
    battlegearCards: number;
    attackCards: number;
    cardsByTribe: Record<CreatureTribe, number>;
};

export type GetUserProgressionOverviewResponseDto = {
    success: boolean;
    overview: UserProgressionOverviewDto | null;
    message?: string;
};

export type RegisterBattleVictoryRequestDto = {
    referenceId?: string | null;
};

export type RegisterCardAwardRequestDto = {
    cardType: UserCardType;
    cardId: string;
    rarity: CardRarity;
    quantity?: number;
    referenceId?: string | null;
};

export type DiscardUserCardRequestDto = {
    userCardId: string;
    quantity?: number;
};

export type ProgressionMutationResponseDto = {
    success: boolean;
    progression: UserProgressionDto | null;
    wallet: {
        coins: number;
        diamonds: number;
    } | null;
    message?: string;
};

export type StarterRewardCardDto = {
    cardType: UserCardType;
    cardId: string;
    rarity: CardRarity;
};

export type StarterRewardPackDto = {
    id: "starter_tribe_creatures" | "starter_mugic_battlegear" | "starter_locations_attacks";
    cards: StarterRewardCardDto[];
};

export type GetStarterProgressionStatusResponseDto = {
    success: boolean;
    requiresChoice: boolean;
    selectedTribe: CreatureTribe | null;
    allowedTribes: StarterSelectableTribe[];
    message?: string;
};

export type ChooseStarterTribeRequestDto = {
    tribe: CreatureTribe;
};

export type ChooseStarterTribeResponseDto = {
    success: boolean;
    selectedTribe: CreatureTribe | null;
    packs: StarterRewardPackDto[];
    progression: UserProgressionDto | null;
    wallet: {
        coins: number;
        diamonds: number;
    } | null;
    message?: string;
};

export function isValidUserCardType(value: string): value is UserCardType {
    return USER_CARD_TYPES.includes(value as UserCardType);
}

export function isValidProgressionEventSource(value: string): value is ProgressionEventSource {
    return PROGRESSION_EVENT_SOURCES.includes(value as ProgressionEventSource);
}

export function isValidStarterSelectableTribe(value: string): value is StarterSelectableTribe {
    return STARTER_TRIBE_OPTIONS.includes(value as StarterSelectableTribe);
}