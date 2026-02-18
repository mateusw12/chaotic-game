import {
    ABILITY_DISCIPLINE_STATS,
    ABILITY_STATS,
    type AbilityCostDto,
    type AbilityConditionDto,
    type AbilityEffectDto,
    type AbilityBattleRuleDto,
    type AbilityDto,
    type CreateAbilityRequestDto,
    type UpdateAbilityRequestDto,
} from "@/dto/ability";
import { getSupabaseAdminClient } from "./storage";
import {
    getAbilitiesTableName,
    isValidAbilityActionType,
    isValidAbilityBattleRuleType,
    isValidAbilityBoardActionType,
    isValidAbilityCardType,
    isValidAbilityCompareOperator,
    isValidAbilityConditionKind,
    isValidAbilityCostKind,
    isValidAbilityCostSource,
    isValidAbilityEffectKind,
    isValidAbilityEffectTarget,
    isValidAbilityTriggerEvent,
    isValidAbilityTriggerSource,
    isValidAbilityZoneType,
    isMissingTableError,
    isValidAbilityCategory,
    isValidAbilityEffectType,
    isValidAbilityStat,
    isValidAbilityTargetScope,
    isValidElement,
    isValidTribe,
} from "./core";
import type { SupabaseAbilityRow, SupabaseApiError } from "./types";

function mapSupabaseAbilityRow(row: SupabaseAbilityRow): AbilityDto {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        effectType: row.effect_type,
        targetScope: row.target_scope,
        stat: row.stat,
        value: row.value,
        description: row.description,
        battleRules: row.battle_rules,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validateAbilityBattleRules(rules: AbilityBattleRuleDto | null | undefined) {
    if (!rules) {
        return;
    }

    if (!isValidAbilityBattleRuleType(rules.type)) {
        throw new Error("Tipo de regra de batalha inválido.");
    }

    if (typeof rules.requiresTarget !== "boolean") {
        throw new Error("requiresTarget deve ser booleano.");
    }

    if (rules.usageLimitPerTurn !== null && (!Number.isInteger(rules.usageLimitPerTurn) || rules.usageLimitPerTurn < 0)) {
        throw new Error("usageLimitPerTurn deve ser inteiro >= 0 ou null.");
    }

    if (rules.targetTribes) {
        if (!Array.isArray(rules.targetTribes) || !rules.targetTribes.every((tribe) => isValidTribe(String(tribe)))) {
            throw new Error("targetTribes contém tribo inválida.");
        }
    }

    if (rules.stats) {
        if (!Array.isArray(rules.stats) || !rules.stats.every((stat) => ABILITY_STATS.includes(stat))) {
            throw new Error("stats contém atributo inválido.");
        }
    }

    if (rules.cardTypes) {
        if (!Array.isArray(rules.cardTypes) || !rules.cardTypes.every((cardType) => isValidAbilityCardType(String(cardType)))) {
            throw new Error("cardTypes contém tipo de carta inválido.");
        }
    }

    if (rules.actionType && !isValidAbilityActionType(rules.actionType)) {
        throw new Error("actionType inválido.");
    }

    if (rules.boardActionType && !isValidAbilityBoardActionType(rules.boardActionType)) {
        throw new Error("boardActionType inválido.");
    }

    if (rules.trigger) {
        if (!isValidAbilityTriggerEvent(rules.trigger.event)) {
            throw new Error("trigger.event inválido.");
        }

        if (
            rules.trigger.source
            && !isValidAbilityTriggerSource(rules.trigger.source)
        ) {
            throw new Error("trigger.source inválido.");
        }

        if (
            rules.trigger.oncePerTurn !== undefined
            && typeof rules.trigger.oncePerTurn !== "boolean"
        ) {
            throw new Error("trigger.oncePerTurn deve ser booleano.");
        }
    }

    const validateCost = (cost: AbilityCostDto, index: number) => {
        if (!isValidAbilityCostKind(cost.kind)) {
            throw new Error(`costs[${index}].kind inválido.`);
        }

        if (cost.source && !isValidAbilityCostSource(cost.source)) {
            throw new Error(`costs[${index}].source inválido.`);
        }

        if (cost.stat && !ABILITY_STATS.includes(cost.stat)) {
            throw new Error(`costs[${index}].stat inválido.`);
        }

        if (cost.value !== undefined && (!Number.isFinite(cost.value) || cost.value < 0)) {
            throw new Error(`costs[${index}].value deve ser número >= 0.`);
        }

        if (cost.element && !isValidElement(cost.element)) {
            throw new Error(`costs[${index}].element inválido.`);
        }

        if (cost.cardType && !isValidAbilityCardType(cost.cardType)) {
            throw new Error(`costs[${index}].cardType inválido.`);
        }

        if (cost.cardCount !== undefined && (!Number.isFinite(cost.cardCount) || cost.cardCount < 0)) {
            throw new Error(`costs[${index}].cardCount deve ser número >= 0.`);
        }
    };

    const validateCondition = (condition: AbilityConditionDto, index: number) => {
        if (!isValidAbilityConditionKind(condition.kind)) {
            throw new Error(`conditions[${index}].kind inválido.`);
        }

        if (
            condition.scope
            && !["self", "target", "controller", "opponent", "all_controlled_creatures"].includes(condition.scope)
        ) {
            throw new Error(`conditions[${index}].scope inválido.`);
        }

        if (condition.stat && !ABILITY_STATS.includes(condition.stat)) {
            throw new Error(`conditions[${index}].stat inválido.`);
        }

        if (condition.operator && !isValidAbilityCompareOperator(condition.operator)) {
            throw new Error(`conditions[${index}].operator inválido.`);
        }

        if (condition.value !== undefined && !Number.isFinite(condition.value)) {
            throw new Error(`conditions[${index}].value deve ser numérico.`);
        }

        if (condition.element && !isValidElement(condition.element)) {
            throw new Error(`conditions[${index}].element inválido.`);
        }

        if (condition.zone && !isValidAbilityZoneType(condition.zone)) {
            throw new Error(`conditions[${index}].zone inválido.`);
        }

        if (condition.cardType && !isValidAbilityCardType(condition.cardType)) {
            throw new Error(`conditions[${index}].cardType inválido.`);
        }
    };

    const validateEffect = (effect: AbilityEffectDto, index: number) => {
        if (!isValidAbilityEffectKind(effect.kind)) {
            throw new Error(`effects[${index}].kind inválido.`);
        }

        if (
            effect.target
            && !isValidAbilityEffectTarget(effect.target)
        ) {
            throw new Error(`effects[${index}].target inválido.`);
        }

        if (effect.stat && !ABILITY_STATS.includes(effect.stat)) {
            throw new Error(`effects[${index}].stat inválido.`);
        }

        if (effect.value !== undefined && !Number.isFinite(effect.value)) {
            throw new Error(`effects[${index}].value deve ser numérico.`);
        }

        if (effect.element && !isValidElement(effect.element)) {
            throw new Error(`effects[${index}].element inválido.`);
        }

        if (effect.fromZone && !isValidAbilityZoneType(effect.fromZone)) {
            throw new Error(`effects[${index}].fromZone inválido.`);
        }

        if (effect.toZone && !isValidAbilityZoneType(effect.toZone)) {
            throw new Error(`effects[${index}].toZone inválido.`);
        }

        if (effect.cardType && !isValidAbilityCardType(effect.cardType)) {
            throw new Error(`effects[${index}].cardType inválido.`);
        }

        if (effect.cardCount !== undefined && (!Number.isFinite(effect.cardCount) || effect.cardCount < 0)) {
            throw new Error(`effects[${index}].cardCount deve ser número >= 0.`);
        }
    };

    if (rules.costs) {
        if (!Array.isArray(rules.costs)) {
            throw new Error("costs deve ser uma lista.");
        }

        rules.costs.forEach(validateCost);
    }

    if (rules.conditions) {
        if (!Array.isArray(rules.conditions)) {
            throw new Error("conditions deve ser uma lista.");
        }

        rules.conditions.forEach(validateCondition);
    }

    if (rules.effects) {
        if (!Array.isArray(rules.effects)) {
            throw new Error("effects deve ser uma lista.");
        }

        rules.effects.forEach(validateEffect);
    }

    if (rules.chooseIncreaseFrom) {
        if (
            !Array.isArray(rules.chooseIncreaseFrom)
            || !rules.chooseIncreaseFrom.every((stat) => ABILITY_DISCIPLINE_STATS.includes(stat))
        ) {
            throw new Error("chooseIncreaseFrom contém disciplina inválida.");
        }
    }

    if (rules.chooseDecreaseFrom) {
        if (
            !Array.isArray(rules.chooseDecreaseFrom)
            || !rules.chooseDecreaseFrom.every((stat) => ABILITY_DISCIPLINE_STATS.includes(stat))
        ) {
            throw new Error("chooseDecreaseFrom contém disciplina inválida.");
        }
    }

    const numericFields = [
        "increaseValue",
        "decreaseValue",
        "ownMugicCardsToDiscard",
        "targetMugicCardsRandomDiscard",
        "moveBonusCells",
        "movementMinCells",
        "movementMaxCells",
    ] as const;

    for (const field of numericFields) {
        const value = rules[field];

        if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
            throw new Error(`${field} deve ser número >= 0.`);
        }
    }

    if (rules.movementMinCells !== undefined && rules.movementMaxCells !== undefined && rules.movementMinCells > rules.movementMaxCells) {
        throw new Error("movementMinCells não pode ser maior que movementMaxCells.");
    }
}

export async function getAbilityById(abilityId: string): Promise<AbilityDto | null> {
    const supabase = getSupabaseAdminClient();
    const tableName = getAbilitiesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,category,effect_type,target_scope,stat,value,description,battle_rules,created_at,updated_at")
        .eq("id", abilityId)
        .maybeSingle<SupabaseAbilityRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela de habilidades antes de vincular criaturas (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return data ? mapSupabaseAbilityRow(data) : null;
}

export async function listAbilities(): Promise<AbilityDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getAbilitiesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,category,effect_type,target_scope,stat,value,description,battle_rules,created_at,updated_at")
        .order("created_at", { ascending: false })
        .returns<SupabaseAbilityRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar habilidades (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return (data ?? []).map(mapSupabaseAbilityRow);
}

export async function createAbility(
    payload: CreateAbilityRequestDto,
): Promise<AbilityDto> {
    if (!payload.name.trim()) {
        throw new Error("Nome da habilidade é obrigatório.");
    }

    if (!isValidAbilityCategory(payload.category)) {
        throw new Error("Categoria de habilidade inválida.");
    }

    if (!isValidAbilityEffectType(payload.effectType)) {
        throw new Error("Tipo de efeito inválido.");
    }

    if (!isValidAbilityTargetScope(payload.targetScope)) {
        throw new Error("Escopo de alvo inválido.");
    }

    if (!isValidAbilityStat(payload.stat)) {
        throw new Error("Atributo de habilidade inválido.");
    }

    if (payload.value < 0) {
        throw new Error("Valor da habilidade não pode ser negativo.");
    }

    validateAbilityBattleRules(payload.battleRules);

    const supabase = getSupabaseAdminClient();
    const tableName = getAbilitiesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: payload.name.trim(),
            category: payload.category,
            effect_type: payload.effectType,
            target_scope: payload.targetScope,
            stat: payload.stat,
            value: payload.value,
            description: payload.description?.trim() || null,
            battle_rules: payload.battleRules ?? null,
        })
        .select("id,name,category,effect_type,target_scope,stat,value,description,battle_rules,created_at,updated_at")
        .single<SupabaseAbilityRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar habilidades (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return mapSupabaseAbilityRow(data);
}

export async function updateAbilityById(
    abilityId: string,
    payload: UpdateAbilityRequestDto,
): Promise<AbilityDto> {
    if (!payload.name.trim()) {
        throw new Error("Nome da habilidade é obrigatório.");
    }

    if (!isValidAbilityCategory(payload.category)) {
        throw new Error("Categoria de habilidade inválida.");
    }

    if (!isValidAbilityEffectType(payload.effectType)) {
        throw new Error("Tipo de efeito inválido.");
    }

    if (!isValidAbilityTargetScope(payload.targetScope)) {
        throw new Error("Escopo de alvo inválido.");
    }

    if (!isValidAbilityStat(payload.stat)) {
        throw new Error("Atributo de habilidade inválido.");
    }

    if (payload.value < 0) {
        throw new Error("Valor da habilidade não pode ser negativo.");
    }

    validateAbilityBattleRules(payload.battleRules);

    const supabase = getSupabaseAdminClient();
    const tableName = getAbilitiesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: payload.name.trim(),
            category: payload.category,
            effect_type: payload.effectType,
            target_scope: payload.targetScope,
            stat: payload.stat,
            value: payload.value,
            description: payload.description?.trim() || null,
            battle_rules: payload.battleRules ?? null,
        })
        .eq("id", abilityId)
        .select("id,name,category,effect_type,target_scope,stat,value,description,battle_rules,created_at,updated_at")
        .single<SupabaseAbilityRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar habilidades (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return mapSupabaseAbilityRow(data);
}

export async function deleteAbilityById(abilityId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getAbilitiesTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", abilityId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover habilidades (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }
}
