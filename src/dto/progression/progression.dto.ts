import type { CardRarity } from "@/dto/creature";

export const USER_CARD_TYPES = ["creature", "location", "mugic", "battlegear", "attack"] as const;

export type UserCardType = (typeof USER_CARD_TYPES)[number];

export const PROGRESSION_EVENT_SOURCES = [
    "battle_victory",
    "card_awarded",
    "card_discarded",
] as const;

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

export function isValidUserCardType(value: string): value is UserCardType {
    return USER_CARD_TYPES.includes(value as UserCardType);
}

export function isValidProgressionEventSource(value: string): value is ProgressionEventSource {
    return PROGRESSION_EVENT_SOURCES.includes(value as ProgressionEventSource);
}