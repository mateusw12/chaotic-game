import { CreatureTribe, CardRarity } from "@/dto/creature";
import { UserCardType } from "@/dto/progression";

export type DecksViewProps = {
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
};

export type DeckFilters = {
  tribe?: CreatureTribe;
  rarity?: CardRarity;
  cardType?: UserCardType;
  name: string;
  energy?: number;
};
