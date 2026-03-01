import type { CardRarity } from "@/dto/creature";
import type { UserCardType, UserProgressionDto } from "@/dto/progression";

export const MISSION_LEVELS = ["iniciante", "intermediario", "avancado"] as const;

export type MissionLevel = (typeof MISSION_LEVELS)[number];

export const MISSION_PERIODS = ["all_time", "daily", "weekly"] as const;

export type MissionPeriod = (typeof MISSION_PERIODS)[number];

export type MissionRewardPreviewDto = {
  coins: number;
  diamonds: number;
  xp: number;
  cardType: UserCardType | null;
  cardRarity: CardRarity | null;
  canGrantFreePack: boolean;
};

export type MissionDto = {
  id: string;
  isSpecial: boolean;
  title: string;
  description: string;
  level: MissionLevel;
  period: MissionPeriod;
  periodKey: string;
  targetValue: number;
  progressValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  reward: MissionRewardPreviewDto;
};

export type MissionsOverviewDto = {
  byLevel: Record<MissionLevel, MissionDto[]>;
  active: MissionDto[];
  completed: MissionDto[];
};

export type GetMissionsResponseDto = {
  success: boolean;
  overview: MissionsOverviewDto | null;
  message?: string;
};

export type ClaimMissionResponseDto = {
  success: boolean;
  mission: MissionDto | null;
  awardedCard: {
    cardType: UserCardType;
    cardId: string;
    cardName: string | null;
    rarity: CardRarity;
    cardImageUrl: string | null;
  } | null;
  progression: UserProgressionDto | null;
  wallet: {
    coins: number;
    diamonds: number;
  } | null;
  message?: string;
};
