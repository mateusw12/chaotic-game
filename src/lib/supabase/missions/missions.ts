import type { CardRarity } from "@/dto/creature";
import type {
  MissionDto,
  MissionLevel,
  MissionPeriod,
  MissionRewardPreviewDto,
  MissionsOverviewDto,
} from "@/dto/mission";
import type { UserCardType } from "@/dto/progression";
import {
  getAttacksTableName,
  getBattlegearTableName,
  getCreaturesTableName,
  getLocationsTableName,
  getMugicTableName,
  getProgressionEventsTableName,
  getUserChallengesTableName,
  getUserMissionClaimsTableName,
  isMissingTableError,
} from "../core";
import {
  getAttackImagePublicUrl,
  getBattlegearImagePublicUrl,
  getCreatureImagePublicUrl,
  getLocationImagePublicUrl,
  getMugicImagePublicUrl,
} from "../storage";
import { applyProgressionEvent, ensureUserProgressionInSupabase, registerCardAward } from "../progression";
import { getSupabaseAdminClient } from "../storage";
import type { SupabaseApiError, SupabaseUserMissionClaimRow } from "../types";

const BASE_TEMPLATE_COUNT = 7;

type MissionMetricType =
  | "win_battles"
  | "open_packs"
  | "win_challenges"
  | "earn_coins"
  | "claim_daily_login"
  | "collect_cards"
  | "win_battles_daily";

type MissionTemplate = {
  metric: MissionMetricType;
  title: string;
  description: string;
  period: MissionPeriod;
  baseTarget: number;
  levelFactor: number;
  cycleFactor: number;
};

type MissionRewardResolved = MissionRewardPreviewDto & {
  cardType: UserCardType | null;
  cardRarity: CardRarity | null;
};

type MissionMetrics = {
  battleWinsTotal: number;
  battleWinsDaily: number;
  packsOpenedWeekly: number;
  challengeWinsTotal: number;
  coinsEarnedTotal: number;
  dailyLoginsWeekly: number;
  cardsAwardedTotal: number;
};

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    metric: "win_battles",
    title: "Vença batalhas",
    description: "Ganhe batalhas no modo jogador.",
    period: "all_time",
    baseTarget: 5,
    levelFactor: 2,
    cycleFactor: 1,
  },
  {
    metric: "open_packs",
    title: "Abra pacotes",
    description: "Abra pacotes na loja durante a semana.",
    period: "weekly",
    baseTarget: 1,
    levelFactor: 0,
    cycleFactor: 1,
  },
  {
    metric: "win_challenges",
    title: "Vença desafios",
    description: "Derrote desafiantes da IA.",
    period: "all_time",
    baseTarget: 2,
    levelFactor: 1,
    cycleFactor: 1,
  },
  {
    metric: "earn_coins",
    title: "Acumule moedas",
    description: "Ganhe moedas em qualquer atividade.",
    period: "all_time",
    baseTarget: 400,
    levelFactor: 40,
    cycleFactor: 100,
  },
  {
    metric: "claim_daily_login",
    title: "Login diário",
    description: "Colete recompensas de login na semana.",
    period: "weekly",
    baseTarget: 2,
    levelFactor: 0,
    cycleFactor: 1,
  },
  {
    metric: "collect_cards",
    title: "Ganhe cartas",
    description: "Receba cartas em recompensas do jogo.",
    period: "all_time",
    baseTarget: 4,
    levelFactor: 1,
    cycleFactor: 1,
  },
  {
    metric: "win_battles_daily",
    title: "Sprint diário",
    description: "Vença batalhas no dia de hoje.",
    period: "daily",
    baseTarget: 2,
    levelFactor: 0,
    cycleFactor: 1,
  },
];

const MISSION_COUNTS: Record<MissionLevel, number> = {
  iniciante: 7,
  intermediario: 14,
  avancado: 28,
};

function missionLevelLabel(level: MissionLevel): string {
  if (level === "iniciante") {
    return "Iniciante";
  }

  if (level === "intermediario") {
    return "Intermediário";
  }

  return "Avançado";
}

function getUtcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function getUtcWeekKey(now = new Date()): string {
  const dayIndex = now.getUTCDay();
  const offsetToMonday = (dayIndex + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offsetToMonday));
  return monday.toISOString().slice(0, 10);
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seedText: string): () => number {
  let state = hashString(seedText) || 1;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clampMin(value: number, minimum: number): number {
  return Math.max(minimum, Math.trunc(value));
}

function computeMissionTarget(template: MissionTemplate, playerLevel: number, cycleIndex: number): number {
  const target = template.baseTarget + (playerLevel * template.levelFactor) + (cycleIndex * template.cycleFactor);
  return clampMin(target, 1);
}

function resolveMissionProgress(metric: MissionMetricType, metrics: MissionMetrics): number {
  if (metric === "win_battles") {
    return metrics.battleWinsTotal;
  }

  if (metric === "open_packs") {
    return metrics.packsOpenedWeekly;
  }

  if (metric === "win_challenges") {
    return metrics.challengeWinsTotal;
  }

  if (metric === "earn_coins") {
    return metrics.coinsEarnedTotal;
  }

  if (metric === "claim_daily_login") {
    return metrics.dailyLoginsWeekly;
  }

  if (metric === "collect_cards") {
    return metrics.cardsAwardedTotal;
  }

  return metrics.battleWinsDaily;
}

function buildMissionPeriodKey(period: MissionPeriod): string {
  if (period === "daily") {
    return getUtcDayKey();
  }

  if (period === "weekly") {
    return getUtcWeekKey();
  }

  return "all-time";
}

function computeReward(level: MissionLevel, missionId: string, periodKey: string): MissionRewardResolved {
  const rng = createSeededRandom(`${level}:${missionId}:${periodKey}:reward`);

  if (level === "iniciante") {
    const coins = 100 + Math.floor(rng() * 201);

    return {
      coins,
      diamonds: 5,
      xp: 40,
      cardType: "creature",
      cardRarity: "comum",
      canGrantFreePack: false,
    };
  }

  if (level === "intermediario") {
    const cardTypes: UserCardType[] = ["creature", "attack", "location", "mugic", "battlegear"];
    const cardType = cardTypes[Math.floor(rng() * cardTypes.length)] ?? "creature";

    return {
      coins: 500,
      diamonds: 10,
      xp: 90,
      cardType,
      cardRarity: "rara",
      canGrantFreePack: false,
    };
  }

  const advancedCardTypes: UserCardType[] = ["creature", "attack", "location", "mugic", "battlegear"];
  const advancedCardType = advancedCardTypes[Math.floor(rng() * advancedCardTypes.length)] ?? "creature";

  return {
    coins: 1000 + Math.floor(rng() * 401),
    diamonds: 20,
    xp: 160,
    cardType: advancedCardType,
    cardRarity: "super_rara",
    canGrantFreePack: rng() >= 0.8,
  };
}

async function listMissionClaims(userId: string): Promise<Set<string>> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUserMissionClaimsTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("mission_id,period_key")
    .eq("user_id", userId)
    .returns<Array<{ mission_id: string; period_key: string }>>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar missões (veja supabase/schema.sql).`);
    }

    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  return new Set((data ?? []).map((item) => `${item.mission_id}:${item.period_key}`));
}

async function listMissionMetrics(userId: string): Promise<MissionMetrics> {
  const supabase = getSupabaseAdminClient();
  const eventsTable = getProgressionEventsTableName();
  const challengesTable = getUserChallengesTableName();

  const dayKey = getUtcDayKey();
  const weekKey = getUtcWeekKey();

  const dayStart = `${dayKey}T00:00:00.000Z`;
  const weekStart = `${weekKey}T00:00:00.000Z`;

  const { data: eventsData, error: eventsError } = await supabase
    .from(eventsTable)
    .select("source,coins_delta,quantity,created_at")
    .eq("user_id", userId)
    .returns<Array<{ source: string; coins_delta: number; quantity: number; created_at: string }>>();

  if (eventsError) {
    throw new Error(`Erro ao consultar métricas de missões: ${eventsError.message}`);
  }

  let battleWinsTotal = 0;
  let battleWinsDaily = 0;
  let packsOpenedWeekly = 0;
  let coinsEarnedTotal = 0;
  let dailyLoginsWeekly = 0;
  let cardsAwardedTotal = 0;

  for (const event of eventsData ?? []) {
    const createdAt = event.created_at;
    const inDay = createdAt >= dayStart;
    const inWeek = createdAt >= weekStart;

    if (event.source === "battle_victory") {
      battleWinsTotal += 1;
      if (inDay) {
        battleWinsDaily += 1;
      }
    }

    if (event.source === "shop_pack_purchase" && inWeek) {
      packsOpenedWeekly += 1;
    }

    if (event.coins_delta > 0) {
      coinsEarnedTotal += event.coins_delta;
    }

    if (event.source === "daily_login" && inWeek) {
      dailyLoginsWeekly += 1;
    }

    if (event.source === "card_awarded") {
      cardsAwardedTotal += Math.max(1, Math.trunc(event.quantity || 1));
    }
  }

  let challengeWinsTotal = 0;

  const { data: challengeData, error: challengeError } = await supabase
    .from(challengesTable)
    .select("status")
    .eq("user_id", userId)
    .eq("status", "won")
    .returns<Array<{ status: string }>>();

  if (!challengeError) {
    challengeWinsTotal = (challengeData ?? []).length;
  }

  return {
    battleWinsTotal,
    battleWinsDaily,
    packsOpenedWeekly,
    challengeWinsTotal,
    coinsEarnedTotal,
    dailyLoginsWeekly,
    cardsAwardedTotal,
  };
}

function buildTierMissions(
  level: MissionLevel,
  count: number,
  playerLevel: number,
  claims: Set<string>,
  metrics: MissionMetrics,
): MissionDto[] {
  const missions: MissionDto[] = [];
  const levelLabel = missionLevelLabel(level);

  for (let index = 0; index < count; index += 1) {
    const template = MISSION_TEMPLATES[index % BASE_TEMPLATE_COUNT];
    const cycleIndex = Math.floor(index / BASE_TEMPLATE_COUNT);
    const targetValue = computeMissionTarget(template, playerLevel, cycleIndex);
    const progressValue = resolveMissionProgress(template.metric, metrics);
    const periodKey = buildMissionPeriodKey(template.period);
    const missionId = `${level}:${template.metric}:${index + 1}`;
    const reward = computeReward(level, missionId, periodKey);
    const claimKey = `${missionId}:${periodKey}`;
    const isClaimed = claims.has(claimKey);
    const isCompleted = progressValue >= targetValue;
    const missionSequence = String(index + 1).padStart(2, "0");

    missions.push({
      id: missionId,
      isSpecial: false,
      title: `${levelLabel} ${missionSequence} • ${template.title}`,
      description: template.description,
      level,
      period: template.period,
      periodKey,
      targetValue,
      progressValue,
      isCompleted,
      isClaimed,
      reward,
    });
  }

  return missions;
}

function buildSpecialMission(
  beginnerMissions: MissionDto[],
  claims: Set<string>,
): MissionDto {
  const missionId = "especial:complete_iniciante";
  const periodKey = "all-time";
  const targetValue = beginnerMissions.length;
  const progressValue = beginnerMissions.filter((mission) => mission.isCompleted && mission.isClaimed).length;
  const claimKey = `${missionId}:${periodKey}`;

  return {
    id: missionId,
    isSpecial: true,
    title: "Complete todas as missões iniciantes",
    description: "Conclua e resgate todas as missões do nível iniciante para desbloquear esta recompensa especial.",
    level: "avancado",
    period: "all_time",
    periodKey,
    targetValue,
    progressValue,
    isCompleted: progressValue >= targetValue,
    isClaimed: claims.has(claimKey),
    reward: {
      coins: 2500,
      diamonds: 50,
      xp: 300,
      cardType: "creature",
      cardRarity: "super_rara",
      canGrantFreePack: true,
    },
  };
}

function buildOverviewFromMissions(missions: MissionDto[]): MissionsOverviewDto {
  const byLevel: MissionsOverviewDto["byLevel"] = {
    iniciante: missions.filter((mission) => mission.level === "iniciante"),
    intermediario: missions.filter((mission) => mission.level === "intermediario"),
    avancado: missions.filter((mission) => mission.level === "avancado"),
  };

  const active = missions
    .filter((mission) => !mission.isClaimed)
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? -1 : 1;
      }

      return a.level.localeCompare(b.level);
    })
    .slice(0, 3);

  const completed = missions.filter((mission) => mission.isCompleted && mission.isClaimed);

  return {
    byLevel,
    active,
    completed,
  };
}

function resolveAwardedCardImageUrl(cardType: UserCardType, imageFileId: string | null, imageUrl: string | null): string | null {
  const normalizedImageFileId = imageFileId?.trim().replace(/^\/+/, "") ?? null;
  const normalizedImageUrl = imageUrl?.trim() ?? null;

  if (!normalizedImageFileId) {
    return normalizedImageUrl;
  }

  if (cardType === "creature") {
    return getCreatureImagePublicUrl(normalizedImageFileId);
  }

  if (cardType === "location") {
    return getLocationImagePublicUrl(normalizedImageFileId);
  }

  if (cardType === "mugic") {
    return getMugicImagePublicUrl(normalizedImageFileId);
  }

  if (cardType === "battlegear") {
    return getBattlegearImagePublicUrl(normalizedImageFileId);
  }

  return getAttackImagePublicUrl(normalizedImageFileId);
}

async function pickRandomCardByTypeAndRarity(cardType: UserCardType, rarity: CardRarity, seed: string): Promise<{ cardId: string; cardName: string | null; cardImageUrl: string | null }> {
  const supabase = getSupabaseAdminClient();

  const getTableName = () => {
    if (cardType === "creature") {
      return getCreaturesTableName();
    }

    if (cardType === "location") {
      return getLocationsTableName();
    }

    if (cardType === "mugic") {
      return getMugicTableName();
    }

    if (cardType === "battlegear") {
      return getBattlegearTableName();
    }

    return getAttacksTableName();
  };

  const tableName = getTableName();
  const { data, error } = await supabase
    .from(tableName)
    .select("id,name,image_file_id,image_url")
    .eq("rarity", rarity)
    .returns<Array<{ id: string; name: string | null; image_file_id: string | null; image_url: string | null }>>();

  if (error) {
    throw new Error(`Erro ao buscar carta de recompensa para missão: ${error.message}`);
  }

  const fallback = await supabase
    .from(tableName)
    .select("id,name,image_file_id,image_url")
    .returns<Array<{ id: string; name: string | null; image_file_id: string | null; image_url: string | null }>>();

  if (fallback.error) {
    throw new Error(`Erro ao buscar carta fallback para missão: ${fallback.error.message}`);
  }

  const rarityPool = data ?? [];
  const fallbackPool = fallback.data ?? [];

  const withImageFileId = (cards: Array<{ image_file_id: string | null; image_url: string | null }>) => cards
    .filter((card) => Boolean(card.image_file_id?.trim()));

  const withAnyImage = (cards: Array<{ image_file_id: string | null; image_url: string | null }>) => cards
    .filter((card) => Boolean(card.image_file_id?.trim() || card.image_url?.trim()));

  const poolPriority = [
    withImageFileId(rarityPool),
    withAnyImage(rarityPool),
    withImageFileId(fallbackPool),
    withAnyImage(fallbackPool),
    rarityPool,
    fallbackPool,
  ];

  const effectivePool = poolPriority.find((pool) => pool.length > 0) ?? [];

  if (effectivePool.length === 0) {
    throw new Error("Não há cartas disponíveis para recompensa de missão.");
  }

  const rng = createSeededRandom(seed);
  const index = Math.floor(rng() * effectivePool.length);
  const selected = effectivePool[Math.min(effectivePool.length - 1, Math.max(0, index))];

  return {
    cardId: selected.id,
    cardName: selected.name ?? null,
    cardImageUrl: resolveAwardedCardImageUrl(cardType, selected.image_file_id ?? null, selected.image_url ?? null),
  };
}

export async function getMissionsOverviewForUser(userId: string): Promise<MissionsOverviewDto> {
  const progression = await ensureUserProgressionInSupabase(userId);
  const [claims, metrics] = await Promise.all([
    listMissionClaims(userId),
    listMissionMetrics(userId),
  ]);

  const beginnerMissions = buildTierMissions("iniciante", MISSION_COUNTS.iniciante, progression.level, claims, metrics);
  const intermediateMissions = buildTierMissions("intermediario", MISSION_COUNTS.intermediario, progression.level, claims, metrics);
  const advancedMissions = buildTierMissions("avancado", MISSION_COUNTS.avancado, progression.level, claims, metrics);
  const specialMission = buildSpecialMission(beginnerMissions, claims);

  const missions = [
    ...beginnerMissions,
    ...intermediateMissions,
    specialMission,
    ...advancedMissions,
  ];

  return buildOverviewFromMissions(missions);
}

export async function claimMissionRewardForUser(userId: string, missionId: string) {
  const overview = await getMissionsOverviewForUser(userId);
  const allMissions = [...overview.byLevel.iniciante, ...overview.byLevel.intermediario, ...overview.byLevel.avancado];
  const mission = allMissions.find((item) => item.id === missionId);

  if (!mission) {
    throw new Error("Missão não encontrada.");
  }

  if (!mission.isCompleted) {
    throw new Error("Missão ainda não foi concluída.");
  }

  if (mission.isClaimed) {
    throw new Error("Recompensa desta missão já foi resgatada.");
  }

  const supabase = getSupabaseAdminClient();
  const claimsTable = getUserMissionClaimsTableName();

  const { data: existingClaim, error: existingClaimError } = await supabase
    .from(claimsTable)
    .select("id")
    .eq("user_id", userId)
    .eq("mission_id", mission.id)
    .eq("period_key", mission.periodKey)
    .maybeSingle<{ id: string }>();

  if (existingClaimError) {
    const supabaseError = existingClaimError as SupabaseApiError;
    throw new Error(`Erro ao verificar claim da missão: ${supabaseError.message}`);
  }

  if (existingClaim?.id) {
    throw new Error("Recompensa desta missão já foi resgatada.");
  }

  const { data: claimRow, error: claimInsertError } = await supabase
    .from(claimsTable)
    .insert({
      user_id: userId,
      mission_id: mission.id,
      period_key: mission.periodKey,
    })
    .select("id,user_id,mission_id,period_key,claimed_at")
    .single<SupabaseUserMissionClaimRow>();

  if (claimInsertError) {
    const supabaseError = claimInsertError as SupabaseApiError;
    if (supabaseError.code === "23505") {
      throw new Error("Recompensa desta missão já foi resgatada.");
    }

    throw new Error(`Erro ao registrar claim da missão: ${supabaseError.message}`);
  }

  try {
    const progressionResult = await applyProgressionEvent({
      userId,
      source: "mission_claimed",
      xpDelta: mission.reward.xp,
      coinsDelta: mission.reward.coins,
      diamondsDelta: mission.reward.diamonds,
      referenceId: `mission:${mission.id}:${mission.periodKey}`,
      metadata: {
        rule: "mission_claimed",
        missionId: mission.id,
        level: mission.level,
      },
    });

    let awardedCard: {
      cardType: UserCardType;
      cardId: string;
      cardName: string | null;
      rarity: CardRarity;
      cardImageUrl: string | null;
    } | null = null;

    if (mission.reward.cardType && mission.reward.cardRarity) {
      const pickedCard = await pickRandomCardByTypeAndRarity(
        mission.reward.cardType,
        mission.reward.cardRarity,
        `${userId}:${mission.id}:${mission.periodKey}:card`,
      );

      await registerCardAward({
        userId,
        cardType: mission.reward.cardType,
        cardId: pickedCard.cardId,
        rarity: mission.reward.cardRarity,
        quantity: 1,
        referenceId: `mission-card:${mission.id}:${mission.periodKey}`,
      });

      awardedCard = {
        cardType: mission.reward.cardType,
        cardId: pickedCard.cardId,
        cardName: pickedCard.cardName,
        rarity: mission.reward.cardRarity,
        cardImageUrl: pickedCard.cardImageUrl,
      };
    }

    const refreshedOverview = await getMissionsOverviewForUser(userId);
    const refreshedMission = [
      ...refreshedOverview.byLevel.iniciante,
      ...refreshedOverview.byLevel.intermediario,
      ...refreshedOverview.byLevel.avancado,
    ].find((item) => item.id === mission.id) ?? { ...mission, isClaimed: true };

    return {
      mission: refreshedMission,
      awardedCard,
      progression: progressionResult.progression,
      wallet: progressionResult.wallet,
    };
  } catch (error) {
    await supabase
      .from(claimsTable)
      .delete()
      .eq("id", claimRow.id)
      .eq("user_id", userId);

    throw error;
  }
}
