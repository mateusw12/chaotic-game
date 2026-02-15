import {
    type AbilityDto,
    type CreateAbilityRequestDto,
    type UpdateAbilityRequestDto,
} from "@/dto/ability";
import { getSupabaseAdminClient } from "./storage";
import {
    getAbilitiesTableName,
    isMissingTableError,
    isValidAbilityCategory,
    isValidAbilityEffectType,
    isValidAbilityStat,
    isValidAbilityTargetScope,
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
