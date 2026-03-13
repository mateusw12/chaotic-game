import { NextResponse } from "next/server";
import type {
  AttackCard,
  BattleFormat,
  BattleSetupResponseDto,
  BattleState,
  BattlegearCard,
  Creature,
  LocationCardData,
  MugicCard,
  PlayerBattleState,
} from "@/components/battle/types";
import { auth } from "@/lib/auth";
import {
  getAttacksTableName,
  getBattlegearTableName,
  getCreaturesTableName,
  getLocationsTableName,
  getMugicTableName,
  getSupabaseAdminClient,
  getUserByEmail,
  getUserDeckOverview,
} from "@/lib/supabase";
import {
  getAttackImagePublicUrl,
  getBattlegearImagePublicUrl,
  getCreatureImagePublicUrl,
  getLocationImagePublicUrl,
  getMugicImagePublicUrl,
} from "@/lib/supabase/storage";

const CARD_FALLBACK_IMAGE = "/assets/card/verso.png";

function normalizeFormat(value: string | null): BattleFormat {
  if (value === "1" || value === "1x1") {
    return 1;
  }

  if (value === "3" || value === "3x3") {
    return 3;
  }

  if (value === "6" || value === "6x6" || value === "5x5") {
    return 6;
  }

  if (value === "10" || value === "10x10" || value === "7x7") {
    return 10;
  }

  return 3;
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickMany<T>(items: T[], count: number): T[] {
  if (items.length === 0 || count <= 0) {
    return [];
  }

  return Array.from({ length: count }, () => randomPick(items));
}

function pickUnique<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(items.length, count));
}

function buildCreatureCard(
  row: { id: string; name: string; energy: number; mugic: number; image_file_id: string | null; image_url: string | null },
): Creature {
  const maxHealth = Math.max(30, row.energy);
  const maxEnergy = Math.max(20, row.energy);

  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_file_id ? (getCreatureImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
    maxHealth,
    health: maxHealth,
    maxEnergy,
    energy: maxEnergy,
    mugicCounterMax: Math.max(0, Math.min(6, row.mugic ?? 0)),
    mugicUsed: 0,
    battlegearEquipped: null,
    isDefeated: false,
  };
}

type AbilityLike = {
  description?: unknown;
  effectType?: unknown;
  stats?: unknown;
  value?: unknown;
};

function parseAbilityList(value: unknown): AbilityLike[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((ability): ability is AbilityLike => typeof ability === "object" && ability !== null);
}

function buildLocationEffectFromAbilities(abilities: unknown): string {
  const abilityList = parseAbilityList(abilities);

  const description = abilityList
    .map((ability) => (typeof ability.description === "string" ? ability.description.trim() : ""))
    .find((entry) => entry.length > 0);

  return description ?? "Sem efeito descritivo";
}

function buildBattlegearBonusEnergyFromAbilities(abilities: unknown): number {
  const abilityList = parseAbilityList(abilities);

  return abilityList.reduce((total, ability) => {
    const effectType = typeof ability.effectType === "string" ? ability.effectType : "";
    const value = typeof ability.value === "number" ? ability.value : 0;
    const stats = Array.isArray(ability.stats) ? ability.stats : [];
    const affectsEnergy = stats.some((stat) => stat === "energy" || stat === "all");

    if (!affectsEnergy || value <= 0) {
      return total;
    }

    if (effectType === "increase" || effectType === "heal") {
      return total + value;
    }

    return total;
  }, 0);
}

export async function GET(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: BattleSetupResponseDto = {
      success: false,
      state: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: BattleSetupResponseDto = {
        success: false,
        state: null,
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const searchParams = new URL(request.url).searchParams;
    const format = normalizeFormat(searchParams.get("format"));
    const deckId = searchParams.get("deckId");
    const mode = searchParams.get("mode") === "collection" ? "collection" : "deck";

    const overview = await getUserDeckOverview(user.id);
    const selectedDeck = deckId
      ? overview.decks.find((deck) => deck.id === deckId) ?? null
      : overview.decks[0] ?? null;

    const expandedEntries = mode === "collection"
      ? overview.collection.flatMap((entry) => {
        const qty = Math.max(1, Math.trunc(entry.quantity || 1));
        return Array.from({ length: qty }, () => ({
          cardType: entry.cardType,
          cardId: entry.cardId,
          quantity: 1,
        }));
      })
      : selectedDeck
        ? selectedDeck.cards.flatMap((entry) => {
          const qty = Math.max(1, Math.trunc(entry.quantity || 1));
          return Array.from({ length: qty }, () => entry);
        })
        : [];

    if (expandedEntries.length === 0) {
      const response: BattleSetupResponseDto = {
        success: false,
        state: null,
        message: mode === "collection"
          ? "Sua coleção está vazia para iniciar batalha."
          : "Nenhum deck encontrado para o usuário.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const selectedCreatureIds = expandedEntries.filter((entry) => entry.cardType === "creature").map((entry) => entry.cardId);
    const selectedAttackIds = expandedEntries.filter((entry) => entry.cardType === "attack").map((entry) => entry.cardId).slice(0, 20);
    const selectedMugicIds = expandedEntries.filter((entry) => entry.cardType === "mugic").map((entry) => entry.cardId).slice(0, 6);
    const selectedBattlegearIds = expandedEntries.filter((entry) => entry.cardType === "battlegear").map((entry) => entry.cardId).slice(0, 6);
    const selectedLocationIds = expandedEntries.filter((entry) => entry.cardType === "location").map((entry) => entry.cardId).slice(0, 10);

    if (selectedCreatureIds.length < format) {
      const response: BattleSetupResponseDto = {
        success: false,
        state: null,
        message: `${mode === "collection" ? "Coleção" : "Deck"} precisa ter pelo menos ${format} criaturas para o formato ${format}x${format}.`,
      };

      return NextResponse.json(response, { status: 400 });
    }

    if (selectedAttackIds.length !== 20) {
      const response: BattleSetupResponseDto = {
        success: false,
        state: null,
        message: `${mode === "collection" ? "Coleção" : "Deck"} precisa ter pelo menos 20 Attack cards.`,
      };

      return NextResponse.json(response, { status: 400 });
    }

    if (selectedLocationIds.length !== 10) {
      const response: BattleSetupResponseDto = {
        success: false,
        state: null,
        message: `${mode === "collection" ? "Coleção" : "Deck"} precisa ter pelo menos 10 Locations.`,
      };

      return NextResponse.json(response, { status: 400 });
    }

    if (selectedMugicIds.length > 6 || selectedBattlegearIds.length > 6) {
      const response: BattleSetupResponseDto = {
        success: false,
        state: null,
        message: `${mode === "collection" ? "Coleção" : "Deck"} excede limite de Mugic/Battlegear (máx. 6).`,
      };

      return NextResponse.json(response, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const selectedCreaturesResult = selectedCreatureIds.length > 0
      ? await supabase.from(getCreaturesTableName()).select("id,name,energy,mugic,image_file_id,image_url").in("id", selectedCreatureIds)
      : { data: [], error: null };
    const selectedAttacksResult = selectedAttackIds.length > 0
      ? await supabase.from(getAttacksTableName()).select("id,name,base_damage,energy_cost,image_file_id,image_url").in("id", selectedAttackIds)
      : { data: [], error: null };
    const selectedMugicsResult = selectedMugicIds.length > 0
      ? await supabase.from(getMugicTableName()).select("id,name,cost,image_file_id,image_url").in("id", selectedMugicIds)
      : { data: [], error: null };
    const selectedBattlegearsResult = selectedBattlegearIds.length > 0
      ? await supabase.from(getBattlegearTableName()).select("id,name,abilities,image_file_id,image_url").in("id", selectedBattlegearIds)
      : { data: [], error: null };
    const selectedLocationsResult = selectedLocationIds.length > 0
      ? await supabase.from(getLocationsTableName()).select("id,name,abilities,image_file_id,image_url").in("id", selectedLocationIds)
      : { data: [], error: null };

    const [poolCreaturesResult, poolAttacksResult, poolMugicsResult, poolBattlegearsResult, poolLocationsResult] = await Promise.all([
      supabase.from(getCreaturesTableName()).select("id,name,energy,mugic,image_file_id,image_url"),
      supabase.from(getAttacksTableName()).select("id,name,base_damage,energy_cost,image_file_id,image_url"),
      supabase.from(getMugicTableName()).select("id,name,cost,image_file_id,image_url"),
      supabase.from(getBattlegearTableName()).select("id,name,abilities,image_file_id,image_url"),
      supabase.from(getLocationsTableName()).select("id,name,abilities,image_file_id,image_url"),
    ]);

    const selectedCreatures = selectedCreaturesResult.data ?? [];
    const selectedAttacks = selectedAttacksResult.data ?? [];
    const selectedMugics = selectedMugicsResult.data ?? [];
    const selectedBattlegears = selectedBattlegearsResult.data ?? [];
    const selectedLocations = selectedLocationsResult.data ?? [];

    const poolCreatures = poolCreaturesResult.data ?? [];
    const poolAttacks = poolAttacksResult.data ?? [];
    const poolMugics = poolMugicsResult.data ?? [];
    const poolBattlegears = poolBattlegearsResult.data ?? [];
    const poolLocations = poolLocationsResult.data ?? [];

    const selectedCreatureMap = new Map(selectedCreatures.map((row) => [row.id, row]));
    const selectedAttackMap = new Map(selectedAttacks.map((row) => [row.id, row]));
    const selectedMugicMap = new Map(selectedMugics.map((row) => [row.id, row]));
    const selectedBattlegearMap = new Map(selectedBattlegears.map((row) => [row.id, row]));
    const selectedLocationMap = new Map(selectedLocations.map((row) => [row.id, row]));

    const userCreatures: Creature[] = selectedCreatureIds
      .map((id) => selectedCreatureMap.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row) => buildCreatureCard(row));

    const userAttacks: AttackCard[] = selectedAttackIds
      .map((id) => selectedAttackMap.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .slice(0, 20)
      .map((row, index) => ({
        id: `${row.id}-atk-${index}`,
        name: row.name,
        damage: Math.max(1, row.base_damage ?? row.energy_cost ?? 5),
        imageUrl: row.image_file_id ? (getAttackImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      }));

    const userMugics: MugicCard[] = selectedMugicIds
      .map((id) => selectedMugicMap.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .slice(0, 6)
      .map((row, index) => ({
        id: `${row.id}-mugic-${index}`,
        name: row.name,
        power: Math.max(1, row.cost ?? 1),
        imageUrl: row.image_file_id ? (getMugicImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      }));

    const userBattlegears: BattlegearCard[] = selectedBattlegearIds
      .map((id) => selectedBattlegearMap.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .slice(0, 6)
      .map((row, index) => ({
        id: `${row.id}-gear-${index}`,
        name: row.name,
        bonusEnergy: buildBattlegearBonusEnergyFromAbilities((row as { abilities?: unknown }).abilities),
        imageUrl: row.image_file_id ? (getBattlegearImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      }));

    const userLocations: LocationCardData[] = selectedLocationIds
      .map((id) => selectedLocationMap.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .slice(0, 10)
      .map((row, index) => ({
        id: `${row.id}-loc-${index}`,
        name: row.name,
        effect: buildLocationEffectFromAbilities((row as { abilities?: unknown }).abilities),
        imageUrl: row.image_file_id ? (getLocationImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      }));

    const opponentCreatureRows = pickUnique(poolCreatures, format);
    const opponentAttackRows = pickMany(poolAttacks, 20);
    const opponentMugicRows = pickMany(poolMugics, Math.min(6, poolMugics.length));
    const opponentBattlegearRows = pickMany(poolBattlegears, Math.min(6, poolBattlegears.length));
    const opponentLocationRows = pickMany(poolLocations, 10);

    const opponentPlayer: PlayerBattleState = {
      id: "opponent-random",
      name: "Oponente Aleatório",
      avatar: "🛡️",
      creatures: opponentCreatureRows.map((row) => buildCreatureCard(row)),
      attacksDeck: opponentAttackRows.map((row, index) => ({
        id: `${row.id}-op-atk-${index}`,
        name: row.name,
        damage: Math.max(1, row.base_damage ?? row.energy_cost ?? 5),
        imageUrl: row.image_file_id ? (getAttackImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      })),
      mugicDeck: opponentMugicRows.map((row, index) => ({
        id: `${row.id}-op-mugic-${index}`,
        name: row.name,
        power: Math.max(1, row.cost ?? 1),
        imageUrl: row.image_file_id ? (getMugicImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      })),
      battlegearDeck: opponentBattlegearRows.map((row, index) => ({
        id: `${row.id}-op-gear-${index}`,
        name: row.name,
        bonusEnergy: buildBattlegearBonusEnergyFromAbilities((row as { abilities?: unknown }).abilities),
        imageUrl: row.image_file_id ? (getBattlegearImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      })),
      locationsDeck: opponentLocationRows.map((row, index) => ({
        id: `${row.id}-op-loc-${index}`,
        name: row.name,
        effect: buildLocationEffectFromAbilities((row as { abilities?: unknown }).abilities),
        imageUrl: row.image_file_id ? (getLocationImagePublicUrl(row.image_file_id) ?? CARD_FALLBACK_IMAGE) : (row.image_url ?? CARD_FALLBACK_IMAGE),
      })),
      defeatedCreatures: 0,
    };

    const bottomPlayer: PlayerBattleState = {
      id: selectedDeck?.id ?? "collection-source",
      name: selectedDeck && mode === "deck" ? `Você • ${selectedDeck.name}` : "Você • Coleção",
      avatar: "⚔️",
      creatures: userCreatures,
      attacksDeck: userAttacks,
      mugicDeck: userMugics,
      battlegearDeck: userBattlegears,
      locationsDeck: userLocations,
      defeatedCreatures: 0,
    };

    const state: BattleState = {
      format,
      topPlayer: opponentPlayer,
      bottomPlayer,
      activeLocationIndex: 0,
      currentTurn: "bottom",
      turnNumber: 1,
      actionMode: "idle",
      selectedAttackBySide: {},
      lastCombatResult: null,
      dragItem: null,
      activeCreatureBySide: {
        top: opponentPlayer.creatures[0]?.id ?? null,
        bottom: bottomPlayer.creatures[0]?.id ?? null,
      },
      winner: null,
    };

    const response: BattleSetupResponseDto = {
      success: true,
      state,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: BattleSetupResponseDto = {
      success: false,
      state: null,
      message: error instanceof Error ? error.message : "Erro ao montar batalha.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
