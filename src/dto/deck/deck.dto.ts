import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { ProgressionMutationResponseDto, UserCardType } from "@/dto/progression";

export type DeckCollectionCardDto = {
  userCardId: string;
  cardType: UserCardType;
  cardId: string;
  name: string;
  imageUrl: string;
  rarity: CardRarity;
  quantity: number;
  energy: number;
  primaryTribe: CreatureTribe | null;
  sellValue: number;
};

export type DeckEntryDto = {
  cardType: UserCardType;
  cardId: string;
  quantity: number;
};

export type DeckDto = {
  id: string;
  name: string;
  cards: DeckEntryDto[];
  createdAt: string;
  updatedAt: string;
};

export type DeckOverviewDto = {
  collection: DeckCollectionCardDto[];
  decks: DeckDto[];
};

export type ListDeckOverviewResponseDto = {
  success: boolean;
  overview: DeckOverviewDto | null;
  message?: string;
};

export type CreateDeckRequestDto = {
  name: string;
};

export type UpdateDeckRequestDto = {
  name?: string;
  cards?: DeckEntryDto[];
};

export type DeckMutationResponseDto = {
  success: boolean;
  deck: DeckDto | null;
  message?: string;
};

export type DeleteDeckResponseDto = {
  success: boolean;
  message?: string;
};

export type AwardCardToDeckRequestDto = {
  cardType: UserCardType;
  cardId: string;
  rarity: CardRarity;
  quantity?: number;
  deckId?: string | null;
  referenceId?: string | null;
};

export type AwardCardToDeckResponseDto = ProgressionMutationResponseDto & {
  deck: DeckDto | null;
};
