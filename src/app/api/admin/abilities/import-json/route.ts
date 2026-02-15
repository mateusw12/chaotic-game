import { NextResponse } from "next/server";
import {
    ABILITY_DISCIPLINE_STATS,
    ABILITY_CATEGORIES,
    ABILITY_EFFECT_TYPES,
    ABILITY_STATS,
    ABILITY_TARGET_SCOPES,
    type AbilityBattleRuleDto,
    type AbilityCategory,
    type AbilityEffectType,
    type AbilityStat,
    type AbilityTargetScope,
} from "@/dto/ability";
import abilitiesSeed from "@/components/data/abilities.json";
import { auth } from "@/lib/auth";
import {
    createAbility,
    getUserByEmail,
    listAbilities,
    updateAbilityById,
} from "@/lib/supabase";

type ImportAbilitiesResponseDto = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

type SeedAbility = {
    name?: unknown;
    category?: unknown;
    effect_type?: unknown;
    effectType?: unknown;
    target_scope?: unknown;
    targetScope?: unknown;
    stat?: unknown;
    value?: unknown;
    description?: unknown;
    battle_rules?: unknown;
    battleRules?: unknown;
};

const FILE_NAME = "abilities.json";

function normalizeCategory(value: unknown): AbilityCategory {
    if (typeof value === "string" && ABILITY_CATEGORIES.includes(value as AbilityCategory)) {
        return value as AbilityCategory;
    }

    return "support";
}

function getRawEffectType(item: SeedAbility): unknown {
    if (item.effect_type !== undefined) {
        return item.effect_type;
    }

    return item.effectType;
}

function getRawTargetScope(item: SeedAbility): unknown {
    if (item.target_scope !== undefined) {
        return item.target_scope;
    }

    return item.targetScope;
}

function normalizeEffectType(value: unknown): AbilityEffectType {
    if (typeof value === "string" && ABILITY_EFFECT_TYPES.includes(value as AbilityEffectType)) {
        return value as AbilityEffectType;
    }

    return "increase";
}

function normalizeTargetScope(value: unknown): AbilityTargetScope {
    if (typeof value === "string" && ABILITY_TARGET_SCOPES.includes(value as AbilityTargetScope)) {
        return value as AbilityTargetScope;
    }

    return "all_creatures";
}

function normalizeStat(value: unknown): AbilityStat {
    if (typeof value === "string" && ABILITY_STATS.includes(value as AbilityStat)) {
        return value as AbilityStat;
    }

    return "energy";
}

function normalizeValue(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.floor(parsed);
}

function normalizeDescription(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function parseBattleRules(value: unknown): AbilityBattleRuleDto | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    return value as AbilityBattleRuleDto;
}

function inferBattleRules(payload: {
    name: string;
    effectType: AbilityEffectType;
    targetScope: AbilityTargetScope;
    stat: AbilityStat;
    value: number;
    description: string | null;
    seedBattleRules: AbilityBattleRuleDto | null;
}): AbilityBattleRuleDto | null {
    if (payload.seedBattleRules) {
        return payload.seedBattleRules;
    }

    const normalizedName = payload.name.toLowerCase();
    const normalizedDescription = (payload.description ?? "").toLowerCase();
    const combinedText = `${normalizedName} ${normalizedDescription}`;

    if (combinedText.includes("ganha 25 em uma disciplina") && combinedText.includes("perde 10 em outra")) {
        return {
            type: "discipline_tradeoff",
            requiresTarget: true,
            usageLimitPerTurn: null,
            chooseIncreaseFrom: [...ABILITY_DISCIPLINE_STATS],
            chooseDecreaseFrom: [...ABILITY_DISCIPLINE_STATS],
            increaseValue: 25,
            decreaseValue: 10,
            notes: "Jogador escolhe uma disciplina para aumentar e outra para diminuir.",
        };
    }

    if (combinedText.includes("descarte uma carta mugic") && combinedText.includes("aleatória")) {
        return {
            type: "discard_mugic_random",
            requiresTarget: true,
            usageLimitPerTurn: 1,
            ownMugicCardsToDiscard: 1,
            targetMugicCardsRandomDiscard: 1,
            notes: "O controlador paga o custo descartando Mugic e o oponente descarta aleatoriamente.",
        };
    }

    if (combinedText.includes("range") && combinedText.includes("intercept")) {
        return {
            type: "intercept_range",
            requiresTarget: false,
            usageLimitPerTurn: null,
            notes: "Permite interceptar ataques de criaturas com Range como se tivesse Defender adjacente.",
        };
    }

    if (combinedText.includes("mugic counter") && combinedText.includes("remova")) {
        return {
            type: "remove_mugic_counter",
            requiresTarget: true,
            usageLimitPerTurn: null,
            notes: "Remove Mugic Counter da criatura alvo.",
        };
    }

    if (combinedText.includes("pode se mover") && payload.value > 0) {
        return {
            type: "move_bonus",
            requiresTarget: false,
            usageLimitPerTurn: null,
            moveBonusCells: payload.value,
            notes: "Concede movimento adicional no tabuleiro.",
        };
    }

    if (payload.effectType === "special") {
        return {
            type: "generic_special",
            requiresTarget: payload.stat !== "none",
            usageLimitPerTurn: null,
            notes: payload.description,
        };
    }

    return {
        type: "stat_modifier",
        requiresTarget: payload.targetScope !== "self",
        usageLimitPerTurn: null,
        notes: null,
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
            message: "Acesso negado. Apenas admin pode importar habilidades.",
        };
    }

    return { ok: true as const };
}

export async function POST() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ImportAbilitiesResponseDto = {
                success: false,
                imported: 0,
                updated: 0,
                skipped: 0,
                fileName: FILE_NAME,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const existing = await listAbilities();
        const existingByName = new Map(
            existing.map((ability) => [ability.name.trim().toLowerCase(), ability]),
        );

        let imported = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of abilitiesSeed as SeedAbility[]) {
            const name = typeof item.name === "string" ? item.name.trim() : "";

            if (!name) {
                skipped += 1;
                continue;
            }

            const normalizedName = name.toLowerCase();

            const payload = {
                name,
                category: normalizeCategory(item.category),
                effectType: normalizeEffectType(getRawEffectType(item)),
                targetScope: normalizeTargetScope(getRawTargetScope(item)),
                stat: normalizeStat(item.stat),
                value: normalizeValue(item.value),
                description: normalizeDescription(item.description),
                battleRules: null as AbilityBattleRuleDto | null,
            };

            payload.battleRules = inferBattleRules({
                name: payload.name,
                effectType: payload.effectType,
                targetScope: payload.targetScope,
                stat: payload.stat,
                value: payload.value,
                description: payload.description,
                seedBattleRules: parseBattleRules(item.battle_rules ?? item.battleRules ?? null),
            });

            const existingAbility = existingByName.get(normalizedName);

            if (existingAbility) {
                await updateAbilityById(existingAbility.id, payload);
                updated += 1;
                continue;
            }

            const created = await createAbility(payload);

            existingByName.set(normalizedName, created);
            imported += 1;
        }

        const response: ImportAbilitiesResponseDto = {
            success: true,
            imported,
            updated,
            skipped,
            fileName: FILE_NAME,
            message: `${FILE_NAME} importado com sucesso.`,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportAbilitiesResponseDto = {
            success: false,
            imported: 0,
            updated: 0,
            skipped: 0,
            fileName: FILE_NAME,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao importar habilidades.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
