import type { CardRarity } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";

export const CHALLENGE_STATUSES = ["pending", "won", "lost", "rejected"] as const;

export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export type ChallengeRewardCardDto = {
  cardType: UserCardType;
  cardId: string;
  cardName: string | null;
  rarity: CardRarity;
};

export type ChallengeDto = {
  id: string;
  challengerName: string;
  creaturesCount: 3 | 7;
  status: ChallengeStatus;
  isBonus: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  rewardCardsCount: number;
  awardedCards: ChallengeRewardCardDto[];
  createdAt: string;
  updatedAt: string;
};

export type ChallengesOverviewDto = {
  challenges: ChallengeDto[];
  pendingCount: number;
  normalWins: number;
};

export type GetChallengesResponseDto = {
  success: boolean;
  overview: ChallengesOverviewDto | null;
  message?: string;
};

export type ChallengeActionResponseDto = {
  success: boolean;
  challenge: ChallengeDto | null;
  wallet: {
    coins: number;
    diamonds: number;
  } | null;
  awardedCards: ChallengeRewardCardDto[];
  message?: string;
};

export function isValidChallengeStatus(value: string): value is ChallengeStatus {
  return CHALLENGE_STATUSES.includes(value as ChallengeStatus);
}
