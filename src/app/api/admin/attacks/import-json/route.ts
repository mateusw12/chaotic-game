import { NextResponse } from "next/server";
import {
  ATTACK_TARGET_SCOPES,
  type AttackAbilityDto,
  type AttackElementValueDto,
  type AttackTargetScope,
  type CreateAttackRequestDto,
} from "@/dto/attack";
import { CARD_RARITIES, CREATURE_ELEMENTS, type CardRarity, type CreatureElement } from "@/dto/creature";
import { LOCATION_EFFECT_TYPES, LOCATION_STATS, type LocationEffectType, type LocationStat } from "@/dto/location";
import attacksSeed from "@/components/data/attack.json";
import { auth } from "@/lib/auth";
import { createAttack, getUserByEmail, listAttacks, updateAttackById } from "@/lib/supabase";

type ImportAttacksResponseDto = {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  fileName: string;
  message?: string;
};

type SeedAttackElementValue = {
  element?: unknown;
  value?: unknown;
};

type SeedAttackAbility = {
  description?: unknown;
  conditionElement?: unknown;
  condition_element?: unknown;
  targetScope?: unknown;
  target_scope?: unknown;
  effectType?: unknown;
  effect_type?: unknown;
  stat?: unknown;
  value?: unknown;
};

type SeedAttack = {
  name?: unknown;
  file_name?: unknown;
  fileName?: unknown;
  rarity?: unknown;
  image_file_id?: unknown;
  imageFileId?: unknown;
  energy_cost?: unknown;
  energyCost?: unknown;
  element_values?: unknown;
  elementValues?: unknown;
  abilities?: unknown;
};

const FILE_NAME = "attack.json";

const ATTACK_ALLOWED_STATS: LocationStat[] = ["power", "courage", "speed", "wisdom", "mugic", "energy"];

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeRarity(value: unknown): CardRarity {
  if (typeof value !== "string") {
    return "comum";
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("á", "a")
    .replaceAll("â", "a")
    .replaceAll("ã", "a")
    .replaceAll("é", "e")
    .replaceAll("ê", "e")
    .replaceAll("í", "i")
    .replaceAll("ó", "o")
    .replaceAll("ô", "o")
    .replaceAll("õ", "o")
    .replaceAll("ú", "u");

  if (normalized === "super_raro") {
    return "super_rara";
  }

  if (normalized === "ultra_raro") {
    return "ultra_rara";
  }

  if (CARD_RARITIES.includes(normalized as CardRarity)) {
    return normalized as CardRarity;
  }

  return "comum";
}

function normalizeEnergyCost(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function normalizeElement(value: unknown): CreatureElement | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return CREATURE_ELEMENTS.includes(normalized as CreatureElement)
    ? (normalized as CreatureElement)
    : null;
}

function normalizeElementValues(value: unknown): AttackElementValueDto[] {
  const rawValues = parseJsonArray(value) as SeedAttackElementValue[];

  return rawValues
    .map((item) => {
      const element = normalizeElement(item.element);

      if (!element) {
        return null;
      }

      return {
        element,
        value: normalizeEnergyCost(item.value),
      } satisfies AttackElementValueDto;
    })
    .filter((item): item is AttackElementValueDto => Boolean(item));
}

function normalizeTargetScope(value: unknown): AttackTargetScope {
  if (typeof value !== "string") {
    return "defender";
  }

  const normalized = value.trim().toLowerCase();

  if (ATTACK_TARGET_SCOPES.includes(normalized as AttackTargetScope)) {
    return normalized as AttackTargetScope;
  }

  if (["opponent", "opposing", "enemy", "defensor", "defender"].includes(normalized)) {
    return "defender";
  }

  return "attacker";
}

function normalizeEffectType(value: unknown): LocationEffectType {
  if (typeof value !== "string") {
    return "decrease";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "increase") {
    return "increase";
  }

  if (normalized === "decrease" || normalized === "damage") {
    return "decrease";
  }

  if (LOCATION_EFFECT_TYPES.includes(normalized as LocationEffectType)) {
    return "decrease";
  }

  if (["protection", "modification", "modifier"].includes(normalized)) {
    return "decrease";
  }

  return "decrease";
}

function inferStatFromDescription(description: string): LocationStat {
  const normalized = description.toLowerCase();

  if (normalized.includes("coragem") || normalized.includes("courage")) {
    return "courage";
  }

  if (normalized.includes("poder") || normalized.includes("power")) {
    return "power";
  }

  if (normalized.includes("velocidade") || normalized.includes("speed")) {
    return "speed";
  }

  if (normalized.includes("sabedoria") || normalized.includes("wisdom")) {
    return "wisdom";
  }

  if (normalized.includes("energia") || normalized.includes("energy")) {
    return "energy";
  }

  if (normalized.includes("mugic")) {
    return "mugic";
  }

  return "energy";
}

function normalizeStat(value: unknown, description: string): LocationStat {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      LOCATION_STATS.includes(normalized as LocationStat)
      && ATTACK_ALLOWED_STATS.includes(normalized as LocationStat)
    ) {
      return normalized as LocationStat;
    }
  }

  const inferred = inferStatFromDescription(description);
  return ATTACK_ALLOWED_STATS.includes(inferred) ? inferred : "energy";
}

function normalizeAbilityValue(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function normalizeAbilities(value: unknown): AttackAbilityDto[] {
  const rawAbilities = parseJsonArray(value) as SeedAttackAbility[];
  const normalized: AttackAbilityDto[] = [];

  for (const ability of rawAbilities) {
    const description = typeof ability.description === "string" ? ability.description.trim() : "";

    if (!description) {
      continue;
    }

    const conditionElement = normalizeElement(ability.condition_element ?? ability.conditionElement);

    normalized.push({
      description,
      conditionElement: conditionElement ?? undefined,
      targetScope: normalizeTargetScope(ability.target_scope ?? ability.targetScope),
      effectType: normalizeEffectType(ability.effect_type ?? ability.effectType),
      stat: normalizeStat(ability.stat, description),
      value: normalizeAbilityValue(ability.value),
    });
  }

  return normalized;
}

function normalizeAttackPayload(item: SeedAttack): CreateAttackRequestDto | null {
  const name = typeof item.name === "string" ? item.name.trim() : "";

  if (!name) {
    return null;
  }

  const imageFileIdRaw = item.image_file_id ?? item.imageFileId;
  const imageFileId = typeof imageFileIdRaw === "string" ? imageFileIdRaw.trim() : "";

  return {
    name,
    fileName: typeof (item.file_name ?? item.fileName) === "string"
      ? String(item.file_name ?? item.fileName).trim() || null
      : null,
    rarity: normalizeRarity(item.rarity),
    imageFileId: imageFileId || null,
    energyCost: normalizeEnergyCost(item.energy_cost ?? item.energyCost),
    elementValues: normalizeElementValues(item.element_values ?? item.elementValues),
    abilities: normalizeAbilities(item.abilities),
  };
}

async function ensureAdminBySessionEmail(email: string | null | undefined) {
  if (!email) {
    return { ok: false as const, status: 401, message: "Usuário não autenticado." };
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return { ok: false as const, status: 404, message: "Usuário não encontrado." };
  }

  if (user.role !== "admin") {
    return {
      ok: false as const,
      status: 403,
      message: "Acesso negado. Apenas admin pode importar ataques.",
    };
  }

  return { ok: true as const };
}

export async function POST() {
  const session = await auth();

  try {
    const access = await ensureAdminBySessionEmail(session?.user?.email);

    if (!access.ok) {
      const response: ImportAttacksResponseDto = {
        success: false,
        imported: 0,
        updated: 0,
        skipped: 0,
        fileName: FILE_NAME,
        message: access.message,
      };

      return NextResponse.json(response, { status: access.status });
    }

    const existing = await listAttacks();
    const existingByName = new Map(existing.map((attack) => [attack.name.trim().toLowerCase(), attack]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const skippedAttacks: any[] = [];

    for (const item of attacksSeed as SeedAttack[]) {
      const payload = normalizeAttackPayload(item);

      if (!payload || !payload.fileName) {
        skipped += 1;
        skippedAttacks.push(item);
        continue;
      }

      const key = payload.name.toLowerCase();
      const existingAttack = existingByName.get(key);

      if (existingAttack) {
        await updateAttackById(existingAttack.id, payload);
        updated += 1;
        continue;
      }

      const created = await createAttack(payload);
      existingByName.set(key, created);
      imported += 1;
    }

    console.log("Skipped Attacks:", skippedAttacks)
    const response: ImportAttacksResponseDto = {
      success: true,
      imported,
      updated,
      skipped,
      fileName: FILE_NAME,
      message: `${FILE_NAME} importado com sucesso.`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ImportAttacksResponseDto = {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      fileName: FILE_NAME,
      message: error instanceof Error ? error.message : "Erro ao importar ataques.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
