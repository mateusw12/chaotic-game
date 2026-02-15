import { NextResponse } from "next/server";
import {
    LOCATION_BATTLE_RULE_TYPES,
    LOCATION_CARD_TYPES,
    LOCATION_EFFECT_TYPES,
    LOCATION_STATS,
    LOCATION_TARGET_SCOPES,
    type CreateLocationRequestDto,
    type LocationBattleRuleDto,
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
    type LocationTargetScope,
} from "@/dto/location";
import { CARD_RARITIES, CREATURE_ELEMENTS, CREATURE_TRIBES, type CardRarity, type CreatureElement, type CreatureTribe } from "@/dto/creature";
import locationsSeed from "@/components/data/locations.json";
import { auth } from "@/lib/auth";
import {
    createLocation,
    getUserByEmail,
    listLocations,
    updateLocationById,
} from "@/lib/supabase";

type ImportLocationsResponseDto = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

type SeedLocationAbility = {
    description?: unknown;
    effectType?: unknown;
    effect_type?: unknown;
    targetScope?: unknown;
    target_scope?: unknown;
    targetTribes?: unknown;
    target_tribes?: unknown;
    stats?: unknown;
    stat?: unknown;
    cardTypes?: unknown;
    card_types?: unknown;
    value?: unknown;
    battleRules?: unknown;
    battle_rules?: unknown;
};

type SeedLocation = {
    name?: unknown;
    rarity?: unknown;
    image_file_id?: unknown;
    imageFileId?: unknown;
    initiative_elements?: unknown;
    initiativeElements?: unknown;
    tribes?: unknown;
    abilities?: unknown;
};

const FILE_NAME = "locations.json";

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

function parseStringArray<T extends string>(
    value: unknown,
    acceptedValues: readonly T[],
): T[] {
    const accepted = new Set<string>(acceptedValues);

    return parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item): item is T => accepted.has(item));
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

function normalizeInitiativeElements(value: unknown): CreatureElement[] {
    const elements = parseStringArray(value, CREATURE_ELEMENTS);

    if (elements.length > 0) {
        return elements;
    }

    return ["air"];
}

function normalizeTribes(value: unknown): CreatureTribe[] {
    return parseStringArray(value, CREATURE_TRIBES);
}

function normalizeTargetScope(value: unknown): LocationTargetScope {
    if (typeof value !== "string") {
        return "all_creatures";
    }

    const normalized = value.trim().toLowerCase();

    if (LOCATION_TARGET_SCOPES.includes(normalized as LocationTargetScope)) {
        return normalized as LocationTargetScope;
    }

    return "all_creatures";
}

function normalizeLocationEffectType(value: unknown): LocationEffectType {
    if (typeof value !== "string") {
        return "increase";
    }

    const normalized = value.trim().toLowerCase();

    if (LOCATION_EFFECT_TYPES.includes(normalized as LocationEffectType)) {
        return normalized as LocationEffectType;
    }

    if (normalized === "debuff") {
        return "decrease";
    }

    return "increase";
}

function normalizeLocationStats(value: unknown, fallbackEffectType: LocationEffectType): LocationStat[] {
    const stats = parseStringArray(value, LOCATION_STATS);

    if (stats.length > 0) {
        return stats;
    }

    if (fallbackEffectType === "special" || fallbackEffectType === "negate") {
        return ["none"];
    }

    return fallbackEffectType === "decrease" ? ["energy"] : ["speed"];
}

function normalizeLocationCardTypes(value: unknown): LocationCardType[] {
    const rawValues = parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim());

    const mappedValues = rawValues.map((item) => {
        if (item === "battlegear") {
            return "equipment";
        }

        return item;
    });

    const accepted = new Set<string>(LOCATION_CARD_TYPES);

    return mappedValues.filter((item): item is LocationCardType => accepted.has(item));
}

function normalizeLocationValue(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.floor(parsed);
}

function parseBattleRules(value: unknown): LocationBattleRuleDto | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const typedValue = value as LocationBattleRuleDto;

    if (!LOCATION_BATTLE_RULE_TYPES.includes(typedValue.type)) {
        return null;
    }

    return typedValue;
}

function detectTargetTribes(text: string): CreatureTribe[] {
    const normalized = text.toLowerCase();
    const tribes: CreatureTribe[] = [];

    if (normalized.includes("overworld") || normalized.includes("outro mundo")) {
        tribes.push("overworld");
    }

    if (normalized.includes("underworld") || normalized.includes("submundo")) {
        tribes.push("underworld");
    }

    if (normalized.includes("mipedian")) {
        tribes.push("mipedian");
    }

    if (normalized.includes("m'arrillian") || normalized.includes("marrillian")) {
        tribes.push("marrillian");
    }

    if (normalized.includes("danian")) {
        tribes.push("danian");
    }

    if (normalized.includes("ancient") || normalized.includes("antigo")) {
        tribes.push("ancient");
    }

    return [...new Set(tribes)];
}

function inferBattleRules(description: string): LocationBattleRuleDto | null {
    const normalized = description.toLowerCase();

    if (normalized.includes("embaralha") && normalized.includes("pilha de descarte") && normalized.includes("baralho de ataques")) {
        return {
            type: "shuffle_attack_discard_into_deck",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("retornar um battlegear") && normalized.includes("pilha de descarte")) {
        return {
            type: "return_battlegear_from_discard",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("sacrifica um battlegear")) {
        return {
            type: "sacrifice_battlegear_on_activate",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("remove um contador de mugic")) {
        return {
            type: "remove_mugic_counter_on_activate",
            requiresTarget: true,
            usageLimitPerTurn: 1,
            notes: description,
            payload: { amount: 1 },
        };
    }

    if (normalized.includes("realocam uma criatura") && normalized.includes("não têm efeito")) {
        return {
            type: "cannot_relocate_creatures",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("revela um novo local ativo")) {
        return {
            type: "reveal_new_active_location",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("início da etapa de ação") && normalized.includes("espaço estiver desocupado") && normalized.includes("pode realocar")) {
        return {
            type: "relocate_to_empty_space_on_action_step",
            requiresTarget: true,
            usageLimitPerTurn: null,
            notes: description,
            payload: { requiresEmptySpace: true },
        };
    }

    if (normalized.includes("afetam ambas as criaturas engajadas")) {
        return {
            type: "shared_engaged_effect",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("não podem se mover") && normalized.includes("pague 1 mugic")) {
        return {
            type: "movement_lock_unless_pay_mugic",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: description,
            payload: { mugicCost: 1 },
        };
    }

    if (normalized.includes("cause") && normalized.includes("de dano")) {
        return {
            type: "damage_on_activation",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("retornar um chieftain") && normalized.includes("pilha de descarte")) {
        return {
            type: "return_chieftain_from_discard",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("marcadores de jade") || normalized.includes("pilar de jade")) {
        return {
            type: "jade_pillar_counter_damage",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("revela uma carta de mugic aleatória") || normalized.includes("não podem ser jogadas neste turno")) {
        return {
            type: "mugic_name_lock_this_turn",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: null,
        };
    }

    if (normalized.includes("minion") && normalized.includes("custam um contador de mugic adicional")) {
        return {
            type: "minion_activated_ability_cost_increase",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: description,
            payload: { costIncrease: 1 },
        };
    }

    if (normalized.includes("descarta 2 cartas") && normalized.includes("baralho de ataques")) {
        return {
            type: "discard_attack_cards_from_deck",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: { amount: 2 },
        };
    }

    if (normalized.includes("compra duas cartas de ataque") && normalized.includes("depois descarta duas cartas de ataque")) {
        return {
            type: "draw_then_discard_attack_cards",
            requiresTarget: false,
            usageLimitPerTurn: 1,
            notes: description,
            payload: { draw: 2, discard: 2 },
        };
    }

    if (normalized.includes("único") || normalized.includes("miragem") || normalized.includes("quando este se torna o local ativo")) {
        return {
            type: "generic_special",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: description,
            payload: null,
        };
    }

    return null;
}

function normalizeLocationAbility(item: SeedLocationAbility): CreateLocationRequestDto["abilities"][number] | null {
    const description = typeof item.description === "string" ? item.description.trim() : "";

    if (!description) {
        return null;
    }

    const effectType = normalizeLocationEffectType(item.effect_type ?? item.effectType);
    const targetTribes = normalizeTribes(item.target_tribes ?? item.targetTribes);
    const inferredTargetTribes = targetTribes.length > 0 ? targetTribes : detectTargetTribes(description);
    const targetScopeRaw = item.target_scope ?? item.targetScope;
    const normalizedTargetScope = normalizeTargetScope(targetScopeRaw);
    const inferredTargetScope: LocationTargetScope =
        inferredTargetTribes.length > 0 ? "specific_tribes" : normalizedTargetScope;

    const stats = normalizeLocationStats(item.stats ?? (item.stat !== undefined ? [item.stat] : []), effectType);

    const battleRules =
        parseBattleRules(item.battle_rules ?? item.battleRules)
        ?? inferBattleRules(description)
        ?? {
            type: "stat_modifier",
            requiresTarget: inferredTargetScope !== "none",
            usageLimitPerTurn: null,
            notes: null,
            payload: null,
        };

    return {
        description,
        effectType,
        targetScope: inferredTargetTribes.length > 0 ? "specific_tribes" : inferredTargetScope,
        targetTribes: inferredTargetTribes,
        stats,
        cardTypes: normalizeLocationCardTypes(item.card_types ?? item.cardTypes ?? []),
        value: normalizeLocationValue(item.value),
        battleRules,
    };
}

function normalizeLocationPayload(item: SeedLocation): CreateLocationRequestDto | null {
    const name = typeof item.name === "string" ? item.name.trim() : "";

    if (!name) {
        return null;
    }

    const rawAbilities = parseJsonArray(item.abilities) as SeedLocationAbility[];
    const abilities = rawAbilities
        .map((ability) => normalizeLocationAbility(ability))
        .filter((ability): ability is CreateLocationRequestDto["abilities"][number] => Boolean(ability));

    if (abilities.length === 0) {
        return null;
    }

    const imageFileIdRaw = item.image_file_id ?? item.imageFileId;
    const imageFileId = typeof imageFileIdRaw === "string" ? imageFileIdRaw.trim() : "";

    return {
        name,
        rarity: normalizeRarity(item.rarity),
        imageFileId: imageFileId || null,
        initiativeElements: normalizeInitiativeElements(item.initiative_elements ?? item.initiativeElements),
        tribes: normalizeTribes(item.tribes),
        abilities,
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
            message: "Acesso negado. Apenas admin pode importar locais.",
        };
    }

    return { ok: true as const };
}

export async function POST() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ImportLocationsResponseDto = {
                success: false,
                imported: 0,
                updated: 0,
                skipped: 0,
                fileName: FILE_NAME,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const existing = await listLocations();
        const existingByName = new Map(
            existing.map((location) => [location.name.trim().toLowerCase(), location]),
        );

        let imported = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of locationsSeed as SeedLocation[]) {
            const payload = normalizeLocationPayload(item);

            if (!payload) {
                skipped += 1;
                continue;
            }

            const normalizedName = payload.name.toLowerCase();
            const existingLocation = existingByName.get(normalizedName);

            if (existingLocation) {
                await updateLocationById(existingLocation.id, payload);
                updated += 1;
                continue;
            }

            const created = await createLocation(payload);
            existingByName.set(normalizedName, created);
            imported += 1;
        }

        const response: ImportLocationsResponseDto = {
            success: true,
            imported,
            updated,
            skipped,
            fileName: FILE_NAME,
            message: `${FILE_NAME} importado com sucesso.`,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportLocationsResponseDto = {
            success: false,
            imported: 0,
            updated: 0,
            skipped: 0,
            fileName: FILE_NAME,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao importar locais.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
