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

export type StorePackTribeWeightsDto = Partial<Record<CreatureTribe, number>>;

export type StorePackPriceOptionDto = {
    currency: StoreCurrency;
    price: number;
};

export type StorePackDto = {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    priceOptions: StorePackPriceOptionDto[];
    currency: StoreCurrency;
    price: number;
    cardsCount: number;
    cardTypes: UserCardType[];
    allowedTribes: CreatureTribe[];
    tribeWeights: StorePackTribeWeightsDto;
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
    currency?: StoreCurrency;
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

export type AdminStorePackDto = {
    id: string;
    name: string;
    description: string;
    imageFileId: string | null;
    imageUrl: string | null;
    cardsCount: number;
    cardTypes: UserCardType[];
    allowedTribes: CreatureTribe[];
    tribeWeights: StorePackTribeWeightsDto;
    rarityWeights: StorePackRarityWeightsDto;
    guaranteedMinRarity: CardRarity | null;
    guaranteedCount: number;
    priceCoins: number | null;
    priceDiamonds: number | null;
    dailyLimit: number | null;
    weeklyLimit: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreateAdminStorePackRequestDto = {
    name: string;
    description?: string | null;
    imageFileId?: string | null;
    cardsCount: number;
    cardTypes: UserCardType[];
    allowedTribes?: CreatureTribe[];
    tribeWeights?: StorePackTribeWeightsDto;
    rarityWeights: StorePackRarityWeightsDto;
    guaranteedMinRarity?: CardRarity | null;
    guaranteedCount?: number;
    priceCoins?: number | null;
    priceDiamonds?: number | null;
    dailyLimit?: number | null;
    weeklyLimit?: number | null;
    isActive?: boolean;
};

export type UpdateAdminStorePackRequestDto = Partial<CreateAdminStorePackRequestDto>;

export type ListAdminStorePacksResponseDto = {
    success: boolean;
    packs: AdminStorePackDto[];
    message?: string;
};

export type CreateAdminStorePackResponseDto = {
    success: boolean;
    pack: AdminStorePackDto | null;
    message?: string;
};

export type UpdateAdminStorePackResponseDto = {
    success: boolean;
    pack: AdminStorePackDto | null;
    message?: string;
};

export type DeleteAdminStorePackResponseDto = {
    success: boolean;
    message?: string;
};

export function isValidStoreCurrency(value: string): value is StoreCurrency {
    return STORE_CURRENCIES.includes(value as StoreCurrency);
}
