import { DeckCollectionCardDto } from "@/dto/deck";
import { UserCardType } from "@/dto/progression";

export const EMPTY_VIEWED_GROUPS: Record<UserCardType, Array<DeckCollectionCardDto & { deckQuantity: number }>> = {
  creature: [],
  mugic: [],
  battlegear: [],
  location: [],
  attack: [],
};

export const CARD_TYPE_OPTIONS: Array<{ value: UserCardType; label: string }> = [
  { value: "creature", label: "Criaturas" },
  { value: "mugic", label: "Mugics" },
  { value: "battlegear", label: "Equipamentos" },
  { value: "location", label: "Locais" },
  { value: "attack", label: "Ataques" },
];
