import { NextResponse } from "next/server";
import {
    ABILITY_DISCIPLINE_STATS,
    ABILITY_CATEGORIES,
    ABILITY_EFFECT_TYPES,
    ABILITY_STATS,
    ABILITY_TARGET_SCOPES,
    type AbilityBattleRuleDto,
    type AbilityCostDto,
    type AbilityEffectDto,
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

function normalizeText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function extractTrigger(text: string, category: AbilityCategory): AbilityBattleRuleDto["trigger"] {
    if (text.includes("no inicio do seu turno") || text.includes("no inicio de cada turno")) {
        return { event: "turn_start", source: "self", oncePerTurn: true };
    }

    if (text.includes("no final de cada turno")) {
        return { event: "turn_end", source: "self", oncePerTurn: true };
    }

    if (text.includes("no inicio do combate")) {
        return { event: "combat_start", source: "self", oncePerTurn: true };
    }

    if (text.includes("quando") && text.includes("vence combate")) {
        return { event: "on_attack_damage_dealt", source: "self" };
    }

    if (category === "innate" || category === "support") {
        return { event: "passive_continuous", source: "self" };
    }

    return { event: "on_activate", source: "self" };
}

function extractCosts(text: string): AbilityCostDto[] {
    const costs: AbilityCostDto[] = [];

    const sacrificeStat = text.match(/sacrifique\s+(\d+)\s+de\s+(coragem|poder|sabedoria|velocidade|energia)/i);
    if (sacrificeStat) {
        const statMap: Record<string, AbilityStat> = {
            coragem: "courage",
            poder: "power",
            sabedoria: "wisdom",
            velocidade: "speed",
            energia: "energy",
        };

        costs.push({
            kind: "sacrifice_stat",
            source: "self",
            stat: statMap[sacrificeStat[2].toLowerCase()],
            value: Number(sacrificeStat[1]),
        });
    }

    if (text.includes("descarte uma carta mugic") || text.includes("descartar uma carta de mugic")) {
        costs.push({
            kind: "discard_card",
            source: "controller",
            cardType: "mugic",
            cardCount: 1,
        });
    }

    const payElement = text.match(/gastar\s+(agua|fogo|terra|ar)/i);
    if (payElement) {
        const map = {
            agua: "water",
            fogo: "fire",
            terra: "earth",
            ar: "air",
        } as const;

        costs.push({
            kind: "pay_element",
            source: "self",
            element: map[payElement[1].toLowerCase() as keyof typeof map],
            value: 1,
        });
    }

    return costs;
}

function extractEffects(text: string, stat: AbilityStat, value: number, effectType: AbilityEffectType): AbilityEffectDto[] {
    const effects: AbilityEffectDto[] = [];

    const healMatch = text.match(/cura\s+(\d+)/i);
    if (healMatch) {
        effects.push({
            kind: "heal_damage",
            target: "target",
            value: Number(healMatch[1]),
        });
    }

    const damageMatch = text.match(/causa\s+(\d+)\s+de\s+dano|causa\s+(\d+)\s+dano/i);
    if (damageMatch) {
        effects.push({
            kind: "deal_damage",
            target: "target",
            value: Number(damageMatch[1] ?? damageMatch[2]),
        });
    }

    const removeMugicCounter = text.match(/remov[ae]\s+(\d+)\s+contador(?:es)?\s+de\s+mugic/i);
    if (removeMugicCounter) {
        effects.push({
            kind: "remove_mugic_counter",
            target: "target",
            value: Number(removeMugicCounter[1]),
        });
    }

    const gainStatMatch = text.match(/ganha\s+(\d+)\s+de\s+(coragem|poder|sabedoria|velocidade|energia|mugic)/i);
    if (gainStatMatch) {
        const statMap: Record<string, AbilityStat> = {
            coragem: "courage",
            poder: "power",
            sabedoria: "wisdom",
            velocidade: "speed",
            energia: "energy",
            mugic: "mugic",
        };

        effects.push({
            kind: "modify_stat",
            target: "target",
            stat: statMap[gainStatMatch[2].toLowerCase()],
            value: Number(gainStatMatch[1]),
        });
    }

    const loseStatMatch = text.match(/perde\s+(\d+)\s+de\s+(coragem|poder|sabedoria|velocidade|energia|mugic)/i);
    if (loseStatMatch) {
        const statMap: Record<string, AbilityStat> = {
            coragem: "courage",
            poder: "power",
            sabedoria: "wisdom",
            velocidade: "speed",
            energia: "energy",
            mugic: "mugic",
        };

        effects.push({
            kind: "modify_stat",
            target: "target",
            stat: statMap[loseStatMatch[2].toLowerCase()],
            value: -Number(loseStatMatch[1]),
        });
    }

    if (text.includes("ganha agua")) {
        effects.push({ kind: "gain_element", target: "target", element: "water", value: 1 });
    }

    if (text.includes("ganha fogo")) {
        effects.push({ kind: "gain_element", target: "target", element: "fire", value: 1 });
    }

    if (text.includes("ganha terra")) {
        effects.push({ kind: "gain_element", target: "target", element: "earth", value: 1 });
    }

    if (text.includes("ganha ar")) {
        effects.push({ kind: "gain_element", target: "target", element: "air", value: 1 });
    }

    if (text.includes("perde um tipo elemental")) {
        effects.push({ kind: "lose_element", target: "target", value: 1 });
    }

    if (effects.length === 0 && stat !== "none" && value > 0) {
        effects.push({
            kind: effectType === "decrease" ? "deal_damage" : "modify_stat",
            target: "target",
            stat,
            value: effectType === "decrease" ? value : value,
        });
    }

    if (effects.length === 0) {
        effects.push({ kind: "none", target: "self", value: 0 });
    }

    return effects;
}

function inferBattleRules(payload: {
    name: string;
    category: AbilityCategory;
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

    const normalizedName = normalizeText(payload.name);
    const normalizedDescription = normalizeText(payload.description ?? "");
    const combinedText = `${normalizedName} ${normalizedDescription}`;

    const genericTrigger = extractTrigger(combinedText, payload.category);
    const genericCosts = extractCosts(combinedText);
    const genericEffects = extractEffects(combinedText, payload.stat, payload.value, payload.effectType);

    if (combinedText.includes("ganha 25 em uma disciplina") && combinedText.includes("perde 10 em outra")) {
        return {
            type: "discipline_tradeoff",
            requiresTarget: true,
            usageLimitPerTurn: null,
            trigger: genericTrigger,
            costs: genericCosts,
            effects: genericEffects,
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
            trigger: genericTrigger,
            costs: genericCosts,
            effects: genericEffects,
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
            trigger: genericTrigger,
            costs: genericCosts,
            effects: genericEffects,
            notes: "Permite interceptar ataques de criaturas com Range como se tivesse Defender adjacente.",
        };
    }

    if (combinedText.includes("mugic counter") && combinedText.includes("remova")) {
        return {
            type: "remove_mugic_counter",
            requiresTarget: true,
            usageLimitPerTurn: null,
            actionType: "remove_mugic_counter",
            trigger: genericTrigger,
            costs: genericCosts,
            effects: [
                {
                    kind: "remove_mugic_counter",
                    target: "target",
                    value: 1,
                },
            ],
            notes: "Remove Mugic Counter da criatura alvo.",
        };
    }

    if (combinedText.includes("sacrifique 20 de coragem") && combinedText.includes("cura 20")) {
        return {
            type: "action_resolution",
            requiresTarget: true,
            usageLimitPerTurn: null,
            actionType: "heal_damage",
            trigger: genericTrigger,
            costs: [
                {
                    kind: "sacrifice_stat",
                    source: "self",
                    stat: "courage",
                    value: 20,
                },
            ],
            effects: [
                {
                    kind: "heal_damage",
                    target: "target",
                    value: 20,
                },
            ],
            notes: "Pague 20 de Coragem para curar 20 de dano da criatura alvo.",
        };
    }

    if (combinedText.includes("pode se mover") && payload.value > 0) {
        return {
            type: "move_bonus",
            requiresTarget: false,
            usageLimitPerTurn: null,
            actionType: "move_creature",
            trigger: genericTrigger,
            costs: genericCosts,
            effects: genericEffects,
            moveBonusCells: payload.value,
            notes: "Concede movimento adicional no tabuleiro.",
        };
    }

    if (payload.effectType === "special") {
        return {
            type: "generic_special",
            requiresTarget: payload.stat !== "none",
            usageLimitPerTurn: null,
            trigger: genericTrigger,
            costs: genericCosts,
            effects: genericEffects,
            notes: payload.description,
        };
    }

    return {
        type: "stat_modifier",
        requiresTarget: payload.targetScope !== "self",
        usageLimitPerTurn: null,
        actionType: payload.effectType === "decrease" ? "deal_damage" : "heal_damage",
        trigger: genericTrigger,
        costs: genericCosts,
        effects: genericEffects,
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
                category: payload.category,
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
