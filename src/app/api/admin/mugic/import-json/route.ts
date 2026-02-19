import { NextResponse } from "next/server";
import {
    MUGIC_ACTION_TYPES,
    MUGIC_ABILITY_TYPES,
    MUGIC_TARGET_SCOPES,
    type CreateMugicRequestDto,
    type MugicActionType,
    type MugicAbilityDto,
} from "@/dto/mugic";
import { CARD_RARITIES, CREATURE_TRIBES, type CardRarity, type CreatureTribe } from "@/dto/creature";
import {
    LOCATION_CARD_TYPES,
    LOCATION_EFFECT_TYPES,
    LOCATION_STATS,
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
} from "@/dto/location";
import mugicSeed from "@/components/data/mujic.json";
import { auth } from "@/lib/auth";
import { createMugic, getUserByEmail, listMugics, updateMugicById } from "@/lib/supabase";

type ImportMugicResponseDto = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

type SeedMugicAbility = {
    abilityType?: unknown;
    description?: unknown;
    effectType?: unknown;
    effect_type?: unknown;
    stats?: unknown;
    stat?: unknown;
    cardTypes?: unknown;
    card_types?: unknown;
    targetScope?: unknown;
    target_scope?: unknown;
    targetTribes?: unknown;
    target_tribes?: unknown;
    value?: unknown;
    actionType?: unknown;
    action_type?: unknown;
    actionPayload?: unknown;
    action_payload?: unknown;
    battleRules?: unknown;
    battle_rules?: unknown;
};

type SeedMugic = {
    name?: unknown;
    file_name?: unknown;
    fileName?: unknown;
    rarity?: unknown;
    image_file_id?: unknown;
    imageFileId?: unknown;
    tribes?: unknown;
    cost?: unknown;
    abilities?: unknown;
};

const FILE_NAME = "mujic.json";

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

function parseJsonObject(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (!trimmed) {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed) as unknown;

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
        } catch {
            return null;
        }
    }

    return null;
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

    if (normalized === "super" || normalized === "super_raro") {
        return "super_rara";
    }

    if (normalized === "ultra" || normalized === "ultra_raro") {
        return "ultra_rara";
    }

    return CARD_RARITIES.includes(normalized as CardRarity) ? (normalized as CardRarity) : "comum";
}

function normalizeTribes(value: unknown): CreatureTribe[] {
    const validTribes = new Set<string>(CREATURE_TRIBES);

    return parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is CreatureTribe => validTribes.has(item));
}

function normalizeCardTypes(value: unknown): LocationCardType[] {
    const validCardTypes = new Set<string>(LOCATION_CARD_TYPES);

    return parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .map((item) => (item === "battlegear" ? "equipment" : item))
        .filter((item): item is LocationCardType => validCardTypes.has(item));
}

function normalizeStats(value: unknown): LocationStat[] {
    const validStats = new Set<string>(LOCATION_STATS);

    return parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is LocationStat => validStats.has(item));
}

function normalizeEffectType(value: unknown): LocationEffectType | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    return LOCATION_EFFECT_TYPES.includes(normalized as LocationEffectType)
        ? (normalized as LocationEffectType)
        : undefined;
}

function normalizeTargetScope(value: unknown): MugicAbilityDto["targetScope"] {
    if (typeof value !== "string") {
        return "self";
    }

    const normalized = value.trim().toLowerCase();

    if (["caster", "self"].includes(normalized)) {
        return "self";
    }

    if (normalized.includes("target") || normalized.includes("enemy") || normalized.includes("opponent") || normalized.includes("engaged")) {
        return "enemy";
    }

    return MUGIC_TARGET_SCOPES.includes(normalized as MugicAbilityDto["targetScope"])
        ? (normalized as MugicAbilityDto["targetScope"])
        : "self";
}

function normalizeAbilityType(value: unknown): MugicAbilityDto["abilityType"] {
    if (typeof value !== "string") {
        return "action";
    }

    const normalized = value.trim().toLowerCase();
    return MUGIC_ABILITY_TYPES.includes(normalized as MugicAbilityDto["abilityType"])
        ? (normalized as MugicAbilityDto["abilityType"])
        : "action";
}

function normalizeActionType(value: unknown): MugicAbilityDto["actionType"] {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    return MUGIC_ACTION_TYPES.includes(normalized as MugicActionType)
        ? (normalized as MugicActionType)
        : undefined;
}

function inferLegacyActionType(effectType: string | undefined, battleRuleType: string | undefined): MugicActionType {
    const byBattleRuleType: Record<string, MugicActionType> = {
        reduce_stats: "modify_stats_map",
        heal_caster: "heal_target",
        heal_and_gain_mugic_counter_if_element: "heal_target",
        copy_heal_or_energy_gain: "heal_target",
        negate_mugic_unless_cost: "cancel_target_mugic",
        relocate_own_creature: "return_target_card_to_hand",
        reduce_attack_damage_per_element: "reduce_chosen_discipline",
        gain_element_or_keyword: "grant_element_attack_bonus",
        gain_keywords_with_elemental_bonus: "grant_element_attack_bonus",
        deal_damage_with_elemental_bonus: "banish_mugic_card_from_discard_then_deal_damage",
        deal_damage_per_element: "banish_mugic_card_from_discard_then_deal_damage",
    };

    if (battleRuleType && byBattleRuleType[battleRuleType]) {
        return byBattleRuleType[battleRuleType];
    }

    if (effectType === "heal") {
        return "heal_target";
    }

    if (effectType === "damage") {
        return "banish_mugic_card_from_discard_then_deal_damage";
    }

    if (effectType === "negate" || effectType === "protection") {
        return "cancel_target_mugic";
    }

    if (effectType === "gain") {
        return "grant_mugic_counter";
    }

    return "cancel_target_activated_ability";
}

function normalizeAbilityValue(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.floor(parsed);
}

function normalizeAbilities(value: unknown): CreateMugicRequestDto["abilities"] {
    const rawAbilities = parseJsonArray(value) as SeedMugicAbility[];

    return rawAbilities
        .map((ability) => {
            const description = typeof ability.description === "string" ? ability.description.trim() : "";

            if (!description) {
                return null;
            }

            const legacyBattleRules = parseJsonObject(ability.battle_rules ?? ability.battleRules);
            const rawEffectType = ability.effect_type ?? ability.effectType;
            const normalizedEffectType = normalizeEffectType(rawEffectType);
            const abilityType = normalizeAbilityType(ability.abilityType);
            const normalizedStats = normalizeStats(ability.stats);
            const actionType = normalizeActionType(ability.action_type ?? ability.actionType);

            const isLegacyBattleRulesFormat = Boolean(
                legacyBattleRules
                && typeof ability.abilityType !== "string"
                && typeof ability.actionType !== "string"
                && typeof ability.action_type !== "string",
            );

            if (isLegacyBattleRulesFormat) {
                const legacyBattleRuleType = typeof legacyBattleRules.type === "string"
                    ? legacyBattleRules.type.trim()
                    : undefined;

                const inferredActionType = inferLegacyActionType(
                    typeof rawEffectType === "string" ? rawEffectType.trim().toLowerCase() : undefined,
                    legacyBattleRuleType,
                );

                return {
                    abilityType: "action",
                    description,
                    cardTypes: normalizeCardTypes(ability.card_types ?? ability.cardTypes ?? ["creature"]),
                    targetScope: normalizeTargetScope(ability.target_scope ?? ability.targetScope),
                    targetTribes: normalizeTribes(ability.target_tribes ?? ability.targetTribes),
                    actionType: inferredActionType,
                    actionPayload: {
                        legacyEffectType: rawEffectType ?? null,
                        legacyBattleRules,
                    },
                } satisfies CreateMugicRequestDto["abilities"][number];
            }

            const baseAbility: CreateMugicRequestDto["abilities"][number] = {
                abilityType,
                description,
                effectType: normalizedEffectType,
                stats: normalizedStats.length > 0
                    ? normalizedStats
                    : normalizeStats(ability.stat !== undefined ? [ability.stat] : []),
                cardTypes: normalizeCardTypes(ability.card_types ?? ability.cardTypes),
                targetScope: normalizeTargetScope(ability.target_scope ?? ability.targetScope),
                targetTribes: normalizeTribes(ability.target_tribes ?? ability.targetTribes),
                value: normalizeAbilityValue(ability.value),
                actionType,
                actionPayload:
                    (ability.action_payload ?? ability.actionPayload)
                        && typeof (ability.action_payload ?? ability.actionPayload) === "object"
                        && !Array.isArray(ability.action_payload ?? ability.actionPayload)
                        ? ((ability.action_payload ?? ability.actionPayload) as Record<string, unknown>)
                        : null,
            };

            if (baseAbility.abilityType === "action" && !baseAbility.actionType) {
                return null;
            }

            if (baseAbility.abilityType === "stat_modifier") {
                if (!baseAbility.effectType || (baseAbility.stats ?? []).length === 0) {
                    return null;
                }
            }

            return baseAbility;
        })
        .filter((ability): ability is CreateMugicRequestDto["abilities"][number] => Boolean(ability));
}

function normalizePayload(item: SeedMugic): CreateMugicRequestDto | null {
    const name = typeof item.name === "string" ? item.name.trim() : "";

    if (!name) {
        return null;
    }

    const imageFileIdRaw = item.image_file_id ?? item.imageFileId;
    const imageFileId = typeof imageFileIdRaw === "string" ? imageFileIdRaw.trim() : "";
    const fileNameRaw = item.file_name ?? item.fileName;
    const fileName = typeof fileNameRaw === "string" ? fileNameRaw.trim() : "";

    return {
        name,
        fileName: fileName || null,
        rarity: normalizeRarity(item.rarity),
        imageFileId: imageFileId || null,
        tribes: normalizeTribes(item.tribes),
        cost: normalizeAbilityValue(item.cost),
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
            message: "Acesso negado. Apenas admin pode importar mugics.",
        };
    }

    return { ok: true as const };
}

export async function POST() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ImportMugicResponseDto = {
                success: false,
                imported: 0,
                updated: 0,
                skipped: 0,
                fileName: FILE_NAME,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const existing = await listMugics();
        const existingByName = new Map(existing.map((item) => [item.name.trim().toLowerCase(), item]));

        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let skippedBySchema = 0;

        for (const item of mugicSeed as SeedMugic[]) {
            const payload = normalizePayload(item);

            if (!payload || payload.abilities.length === 0) {
                skipped += 1;
                continue;
            }

            const key = payload.name.toLowerCase();
            const existingItem = existingByName.get(key);

            try {
                if (existingItem) {
                    await updateMugicById(existingItem.id, payload);
                    updated += 1;
                    continue;
                }

                const created = await createMugic(payload);
                existingByName.set(key, created);
                imported += 1;
            } catch (itemError) {
                const message = itemError instanceof Error ? itemError.message : "";

                if (message.includes("mugic_abilities_shape_check") || message.includes("Erro Supabase [23514]")) {
                    skipped += 1;
                    skippedBySchema += 1;
                    continue;
                }

                throw itemError;
            }
        }

        const response: ImportMugicResponseDto = {
            success: true,
            imported,
            updated,
            skipped,
            fileName: FILE_NAME,
            message:
                skippedBySchema > 0
                    ? `${FILE_NAME} importado parcialmente. ${skippedBySchema} registro(s) ignorado(s) por incompatibilidade do check mugic_abilities_shape_check; aplique a migração atualizada em supabase/schema.sql.`
                    : `${FILE_NAME} importado com sucesso.`,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportMugicResponseDto = {
            success: false,
            imported: 0,
            updated: 0,
            skipped: 0,
            fileName: FILE_NAME,
            message: error instanceof Error ? error.message : "Erro ao importar mugics.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
