import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { UserCardType, UserProgressionDto } from "@/dto/progression";

export const STORE_CURRENCIES = ["coins", "diamonds"] as const;

export type StoreCurrency = (typeof STORE_CURRENCIES)[number];

export const STORE_LIMIT_WINDOWS = ["daily", "weekly"] as const;

export type StoreLimitWindow = (typeof STORE_LIMIT_WINDOWS)[number];

export type StorePackLimitDto = {
    window: StoreLimitWindow;
    maxPurchases: number;
    remainingPurchases: number;
};

export type StorePackRarityWeightsDto = Record<CardRarity, number>;

export type StorePackDto = {
    id: string;
    name: string;
    description: string;
    currency: StoreCurrency;
    price: number;
    cardsCount: number;
    cardTypes: UserCardType[];
    tribeFilter: CreatureTribe | null;
    guaranteedMinRarity: CardRarity | null;
    guaranteedCount: number;
    rarityWeights: StorePackRarityWeightsDto;
    limits: StorePackLimitDto[];
};

export type StoreRevealCardDto = {
    cardType: UserCardType;
    cardId: string;
    rarity: CardRarity;
    cardName: string | null;
    cardImageUrl: string | null;
    isDuplicateInCollection: boolean;
    sellValue: number;
};

export type StoreSellCardInputDto = {
    cardType: UserCardType;
    cardId: string;
    quantity?: number;
};

export type GetStorePacksResponseDto = {
    success: boolean;
    packs: StorePackDto[];
    wallet: {
        coins: number;
        diamonds: number;
    } | null;
    message?: string;
};

export type PurchaseStorePackRequestDto = {
    packId: string;
};

export type PurchaseStorePackResponseDto = {
    success: boolean;
    packId: string | null;
    cards: StoreRevealCardDto[];
    progression: UserProgressionDto | null;
    wallet: {
        coins: number;
        diamonds: number;
    } | null;
    message?: string;
};

export type SellStoreCardsRequestDto = {
    cards: StoreSellCardInputDto[];
};

export type SellStoreCardsResponseDto = {
    success: boolean;
    soldCount: number;
    coinsEarned: number;
    wallet: {
        coins: number;
        diamonds: number;
    } | null;
    progression: UserProgressionDto | null;
    message?: string;
};

export function isValidStoreCurrency(value: string): value is StoreCurrency {
    return STORE_CURRENCIES.includes(value as StoreCurrency);
}
