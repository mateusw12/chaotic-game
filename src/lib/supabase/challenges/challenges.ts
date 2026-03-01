import type {
  ChallengeDto,
  ChallengeRewardCardDto,
  ChallengesOverviewDto,
} from "@/dto/challenge";
import type { CardRarity } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";
import {
  getAttacksTableName,
  getBattlegearTableName,
  getCreaturesTableName,
  getLocationsTableName,
  getMugicTableName,
  getUserChallengesTableName,
  isMissingTableError,
} from "../core";
import { getSupabaseAdminClient } from "../storage";
import type { SupabaseApiError, SupabaseUserChallengeRow } from "../types";
import { registerCardAward } from "../progression";
import { creditUserWalletByUserId, ensureUserWalletInSupabase } from "../wallets";

const DEFAULT_DAILY_PROBABILITY = 0.6;
const CHALLENGER_NAMES = [
  "Kaorin",
  "Takinom",
  "Nivenna",
  "Rareth",
  "Mugra",
  "Kheyn",
  "Lyris",
  "Dromak",
  "Sareen",
  "Vorim",
];

type CardPoolItem = {
  id: string;
  name: string;
  rarity: CardRarity;
};

type CardPools = Record<UserCardType, CardPoolItem[]>;

function parseDailyProbability(): number {
  const value = Number.parseFloat(process.env.CHALLENGES_DAILY_PROBABILITY ?? "");

  if (!Number.isFinite(value)) {
    return DEFAULT_DAILY_PROBABILITY;
  }

  return Math.min(1, Math.max(0, value));
}

function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
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

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function normalizeRarity(value: string | null | undefined): CardRarity {
  const normalized = (value ?? "").toLowerCase().replace(/\s+/g, "_");

  if (normalized === "comum" || normalized === "incomum" || normalized === "rara" || normalized === "super_rara" || normalized === "ultra_rara") {
    return normalized;
  }

  return "comum";
}

function randomItem<T>(items: T[], rng: () => number): T {
  const index = Math.floor(rng() * items.length);
  return items[Math.min(items.length - 1, Math.max(0, index))];
}

function mapChallengeRow(row: SupabaseUserChallengeRow): ChallengeDto {
  return {
    id: row.id,
    challengerName: row.challenger_name,
    creaturesCount: row.creatures_count === 7 ? 7 : 3,
    status: row.status,
    isBonus: row.is_bonus,
    rewardCoins: row.reward_coins,
    rewardDiamonds: row.reward_diamonds,
    rewardCardsCount: row.reward_cards_count,
    awardedCards: row.awarded_cards ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChallengesOverview(rows: SupabaseUserChallengeRow[]): ChallengesOverviewDto {
  const challenges = rows.map(mapChallengeRow);

  return {
    challenges,
    pendingCount: challenges.filter((item) => item.status === "pending").length,
    normalWins: challenges.filter((item) => !item.isBonus && item.status === "won").length,
  };
}

function buildDailyChallenges(userId: string, dayKey: string): Array<{
  user_id: string;
  challenger_name: string;
  creatures_count: 3 | 7;
  status: "pending";
  is_bonus: boolean;
  reward_coins: number;
  reward_diamonds: number;
  reward_cards_count: number;
  generated_for_date: string;
}> {
  const rng = createSeededRandom(`${userId}:${dayKey}:daily`);

  if (rng() > parseDailyProbability()) {
    return [];
  }

  const total = randomInt(rng, 1, 3);
  const startsWithSeven = rng() >= 0.5;
  const challenges: Array<{
    user_id: string;
    challenger_name: string;
    creatures_count: 3 | 7;
    status: "pending";
    is_bonus: boolean;
    reward_coins: number;
    reward_diamonds: number;
    reward_cards_count: number;
    generated_for_date: string;
  }> = [];

  for (let index = 0; index < total; index += 1) {
    const creaturesCount = (startsWithSeven ? index % 2 === 0 : index % 2 !== 0) ? 7 : 3;
    const coinMin = creaturesCount === 7 ? 120 : 60;
    const coinMax = creaturesCount === 7 ? 260 : 160;

    challenges.push({
      user_id: userId,
      challenger_name: randomItem(CHALLENGER_NAMES, rng),
      creatures_count: creaturesCount,
      status: "pending",
      is_bonus: false,
      reward_coins: randomInt(rng, coinMin, coinMax),
      reward_diamonds: 0,
      reward_cards_count: 1,
      generated_for_date: dayKey,
    });
  }

  return challenges;
}

async function ensureDailyChallengesGenerated(userId: string, date = new Date()): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUserChallengesTableName();
  const dayKey = getDayKey(date);

  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .eq("user_id", userId)
    .eq("generated_for_date", dayKey)
    .limit(1)
    .returns<Array<{ id: string }>>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar desafios (veja supabase/schema.sql).`);
    }

    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  if ((data ?? []).length > 0) {
    return;
  }

  const inserts = buildDailyChallenges(userId, dayKey);

  if (inserts.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from(tableName)
    .insert(inserts);

  if (insertError) {
    const supabaseError = insertError as SupabaseApiError;
    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }
}

async function listChallengeRows(userId: string): Promise<SupabaseUserChallengeRow[]> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUserChallengesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("id,user_id,challenger_name,creatures_count,status,is_bonus,reward_coins,reward_diamonds,reward_cards_count,awarded_cards,generated_for_date,bonus_cycle,resolved_at,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SupabaseUserChallengeRow[]>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar desafios (veja supabase/schema.sql).`);
    }

    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  return data ?? [];
}

async function getPendingChallengeOrThrow(userId: string, challengeId: string): Promise<SupabaseUserChallengeRow> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUserChallengesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("id,user_id,challenger_name,creatures_count,status,is_bonus,reward_coins,reward_diamonds,reward_cards_count,awarded_cards,generated_for_date,bonus_cycle,resolved_at,created_at,updated_at")
    .eq("id", challengeId)
    .eq("user_id", userId)
    .maybeSingle<SupabaseUserChallengeRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;
    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  if (!data) {
    throw new Error("Desafio não encontrado.");
  }

  if (data.status !== "pending") {
    throw new Error("Este desafio não está mais pendente.");
  }

  return data;
}

async function listCardsForType(cardType: UserCardType): Promise<CardPoolItem[]> {
  const supabase = getSupabaseAdminClient();

  if (cardType === "creature") {
    const { data, error } = await supabase
      .from(getCreaturesTableName())
      .select("id,name,rarity")
      .returns<Array<{ id: string; name: string; rarity: string }>>();

    if (error) {
      throw new Error(`Erro ao consultar criaturas para recompensa: ${error.message}`);
    }

    return (data ?? []).map((item) => ({ id: item.id, name: item.name, rarity: normalizeRarity(item.rarity) }));
  }

  if (cardType === "location") {
    const { data, error } = await supabase
      .from(getLocationsTableName())
      .select("id,name,rarity")
      .returns<Array<{ id: string; name: string; rarity: string }>>();

    if (error) {
      throw new Error(`Erro ao consultar locais para recompensa: ${error.message}`);
    }

    return (data ?? []).map((item) => ({ id: item.id, name: item.name, rarity: normalizeRarity(item.rarity) }));
  }

  if (cardType === "mugic") {
    const { data, error } = await supabase
      .from(getMugicTableName())
      .select("id,name,rarity")
      .returns<Array<{ id: string; name: string; rarity: string }>>();

    if (error) {
      throw new Error(`Erro ao consultar mugics para recompensa: ${error.message}`);
    }

    return (data ?? []).map((item) => ({ id: item.id, name: item.name, rarity: normalizeRarity(item.rarity) }));
  }

  if (cardType === "battlegear") {
    const { data, error } = await supabase
      .from(getBattlegearTableName())
      .select("id,name,rarity")
      .returns<Array<{ id: string; name: string; rarity: string }>>();

    if (error) {
      throw new Error(`Erro ao consultar equipamentos para recompensa: ${error.message}`);
    }

    return (data ?? []).map((item) => ({ id: item.id, name: item.name, rarity: normalizeRarity(item.rarity) }));
  }

  const { data, error } = await supabase
    .from(getAttacksTableName())
    .select("id,name,rarity")
    .returns<Array<{ id: string; name: string; rarity: string }>>();

  if (error) {
    throw new Error(`Erro ao consultar ataques para recompensa: ${error.message}`);
  }

  return (data ?? []).map((item) => ({ id: item.id, name: item.name, rarity: normalizeRarity(item.rarity) }));
}

async function getCardPools(): Promise<CardPools> {
  const [creatures, locations, mugics, battlegears, attacks] = await Promise.all([
    listCardsForType("creature"),
    listCardsForType("location"),
    listCardsForType("mugic"),
    listCardsForType("battlegear"),
    listCardsForType("attack"),
  ]);

  return {
    creature: creatures,
    location: locations,
    mugic: mugics,
    battlegear: battlegears,
    attack: attacks,
  };
}

async function awardCardsForChallenge(userId: string, challengeId: string, quantity: number): Promise<ChallengeRewardCardDto[]> {
  const pools = await getCardPools();
  const cardTypes: UserCardType[] = ["creature", "location", "mugic", "battlegear", "attack"];
  const awarded: ChallengeRewardCardDto[] = [];
  const rng = createSeededRandom(`${challengeId}:${Date.now()}:rewards`);

  for (let index = 0; index < quantity; index += 1) {
    const shuffled = [...cardTypes].sort(() => rng() - 0.5);
    let pickedType: UserCardType | null = null;
    let pickedCard: CardPoolItem | null = null;

    for (const cardType of shuffled) {
      const pool = pools[cardType];

      if (pool.length === 0) {
        continue;
      }

      pickedType = cardType;
      pickedCard = randomItem(pool, rng);
      break;
    }

    if (!pickedType || !pickedCard) {
      break;
    }

    await registerCardAward({
      userId,
      cardType: pickedType,
      cardId: pickedCard.id,
      rarity: pickedCard.rarity,
      quantity: 1,
      referenceId: `challenge:${challengeId}`,
    });

    awarded.push({
      cardType: pickedType,
      cardId: pickedCard.id,
      cardName: pickedCard.name,
      rarity: pickedCard.rarity,
    });
  }

  return awarded;
}

async function createBonusChallengeIfEligible(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUserChallengesTableName();

  const { count, error: countError } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_bonus", false)
    .eq("status", "won");

  if (countError) {
    throw new Error(`Erro ao contar vitórias para bônus de desafio: ${countError.message}`);
  }

  const normalWins = count ?? 0;

  if (normalWins === 0 || normalWins % 7 !== 0) {
    return;
  }

  const bonusCycle = Math.floor(normalWins / 7);

  const { data: existingBonus, error: existingError } = await supabase
    .from(tableName)
    .select("id")
    .eq("user_id", userId)
    .eq("is_bonus", true)
    .eq("bonus_cycle", bonusCycle)
    .limit(1)
    .returns<Array<{ id: string }>>();

  if (existingError) {
    throw new Error(`Erro ao consultar desafio bônus: ${existingError.message}`);
  }

  if ((existingBonus ?? []).length > 0) {
    return;
  }

  const rng = createSeededRandom(`${userId}:bonus:${bonusCycle}`);

  const { error: insertError } = await supabase
    .from(tableName)
    .insert({
      user_id: userId,
      challenger_name: "Grande Mestre Caótico",
      creatures_count: 7,
      status: "pending",
      is_bonus: true,
      reward_coins: randomInt(rng, 350, 700),
      reward_diamonds: randomInt(rng, 8, 20),
      reward_cards_count: 5,
      generated_for_date: getDayKey(),
      bonus_cycle: bonusCycle,
    });

  if (insertError) {
    throw new Error(`Erro ao criar desafio bônus: ${insertError.message}`);
  }
}

export async function getChallengesOverviewForUser(userId: string): Promise<ChallengesOverviewDto> {
  await ensureDailyChallengesGenerated(userId);
  const rows = await listChallengeRows(userId);
  return mapChallengesOverview(rows);
}

export async function declineChallengeForUser(userId: string, challengeId: string): Promise<ChallengeDto> {
  await getPendingChallengeOrThrow(userId, challengeId);
  const supabase = getSupabaseAdminClient();
  const tableName = getUserChallengesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", challengeId)
    .eq("user_id", userId)
    .select("id,user_id,challenger_name,creatures_count,status,is_bonus,reward_coins,reward_diamonds,reward_cards_count,awarded_cards,generated_for_date,bonus_cycle,resolved_at,created_at,updated_at")
    .single<SupabaseUserChallengeRow>();

  if (error) {
    throw new Error(`Erro ao recusar desafio: ${error.message}`);
  }

  return mapChallengeRow(data);
}

export async function acceptChallengeForUser(userId: string, challengeId: string): Promise<{
  challenge: ChallengeDto;
  awardedCards: ChallengeRewardCardDto[];
  wallet: {
    coins: number;
    diamonds: number;
  };
}> {
  const challenge = await getPendingChallengeOrThrow(userId, challengeId);
  const rng = createSeededRandom(`${challengeId}:${Date.now()}:result`);
  const winChance = challenge.creatures_count === 7 ? 0.52 : 0.62;
  const didWin = rng() <= winChance;

  let awardedCards: ChallengeRewardCardDto[] = [];

  if (didWin) {
    if (challenge.reward_cards_count > 0) {
      awardedCards = await awardCardsForChallenge(userId, challenge.id, challenge.reward_cards_count);
    }

    if (challenge.reward_coins > 0 || challenge.reward_diamonds > 0) {
      await creditUserWalletByUserId(userId, challenge.reward_coins, challenge.reward_diamonds);
    }
  }

  const supabase = getSupabaseAdminClient();
  const tableName = getUserChallengesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .update({
      status: didWin ? "won" : "lost",
      awarded_cards: awardedCards,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", challenge.id)
    .eq("user_id", userId)
    .select("id,user_id,challenger_name,creatures_count,status,is_bonus,reward_coins,reward_diamonds,reward_cards_count,awarded_cards,generated_for_date,bonus_cycle,resolved_at,created_at,updated_at")
    .single<SupabaseUserChallengeRow>();

  if (error) {
    throw new Error(`Erro ao concluir desafio: ${error.message}`);
  }

  if (didWin && !challenge.is_bonus) {
    await createBonusChallengeIfEligible(userId);
  }

  const wallet = await ensureUserWalletInSupabase(userId);

  return {
    challenge: mapChallengeRow(data),
    awardedCards,
    wallet: {
      coins: wallet.coins,
      diamonds: wallet.diamonds,
    },
  };
}
