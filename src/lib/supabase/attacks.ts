import {
    type AttackAbilityDto,
    type AttackDto,
    type AttackElementValueDto,
    type AttackTargetScope,
    type CreateAttackRequestDto,
    type UpdateAttackRequestDto,
    isValidAttackEffectType,
    isValidAttackElement,
    isValidAttackStat,
    isValidAttackTargetScope,
} from "@/dto/attack";
import { isValidCardRarity } from "@/dto/creature";
import type { LocationEffectType, LocationStat } from "@/dto/location";
import { getAttackImagePublicUrl, getSupabaseAdminClient } from "./storage";
import { getAttacksTableName, isMissingTableError } from "./core";
import type { SupabaseApiError, SupabaseAttackRow } from "./types";

function mapRow(row: SupabaseAttackRow): AttackDto {
    const resolvedImageUrl = row.image_file_id
        ? getAttackImagePublicUrl(row.image_file_id)
        : row.image_url;

    return {
        id: row.id,
        name: row.name,
        rarity: row.rarity,
        imageFileId: row.image_file_id,
        imageUrl: resolvedImageUrl,
        energyCost: row.energy_cost,
        elementValues: row.element_values,
        abilities: row.abilities,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validatePayload(payload: CreateAttackRequestDto | UpdateAttackRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do ataque é obrigatório.");
    }

    if (!isValidCardRarity(payload.rarity)) {
        throw new Error("Raridade inválida.");
    }

    if (payload.energyCost < 0) {
        throw new Error("Custo de energia não pode ser negativo.");
    }

    if (!Array.isArray(payload.elementValues)) {
        throw new Error("Elementos do ataque precisam ser uma lista.");
    }

    payload.elementValues.forEach((elementValue, index) => {
        if (!isValidAttackElement(elementValue.element)) {
            throw new Error(`Elemento #${index + 1} do ataque é inválido.`);
        }

        if (elementValue.value < 0) {
            throw new Error(`Valor do elemento #${index + 1} não pode ser negativo.`);
        }
    });

    if (!Array.isArray(payload.abilities)) {
        throw new Error("Habilidades do ataque precisam ser uma lista.");
    }

    payload.abilities.forEach((ability, index) => {
        if (!ability.description.trim()) {
            throw new Error(`Descrição da habilidade #${index + 1} é obrigatória.`);
        }

        if (ability.conditionElement && !isValidAttackElement(ability.conditionElement)) {
            throw new Error(`Elemento condicional da habilidade #${index + 1} é inválido.`);
        }

        if (!isValidAttackTargetScope(ability.targetScope as AttackTargetScope)) {
            throw new Error(`Alvo da habilidade #${index + 1} é inválido.`);
        }

        if (!isValidAttackEffectType(ability.effectType as LocationEffectType)) {
            throw new Error(`Tipo da habilidade #${index + 1} é inválido.`);
        }

        if (!isValidAttackStat(ability.stat as LocationStat)) {
            throw new Error(`Atributo da habilidade #${index + 1} é inválido.`);
        }

        if (ability.value < 0) {
            throw new Error(`Valor da habilidade #${index + 1} não pode ser negativo.`);
        }
    });
}

function normalizeElementValues(elementValues: AttackElementValueDto[]): AttackElementValueDto[] {
    return elementValues
        .filter((item) => isValidAttackElement(item.element))
        .map((item) => ({ element: item.element, value: Number(item.value ?? 0) }));
}

function normalizeAbilities(abilities: AttackAbilityDto[]): AttackAbilityDto[] {
    return abilities.map((ability) => ({
        description: ability.description,
        conditionElement: ability.conditionElement,
        targetScope: ability.targetScope,
        effectType: ability.effectType,
        stat: ability.stat,
        value: Number(ability.value ?? 0),
    }));
}

export async function listAttacks(): Promise<AttackDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getAttacksTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,rarity,image_file_id,image_url,energy_cost,element_values,abilities,created_at,updated_at")
        .order("created_at", { ascending: false })
        .returns<SupabaseAttackRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar ataques (veja supabase/schema.sql).`);
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return (data ?? []).map(mapRow);
}

export async function createAttack(payload: CreateAttackRequestDto): Promise<AttackDto> {
    validatePayload(payload);

    const supabase = getSupabaseAdminClient();
    const tableName = getAttacksTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: payload.name.trim(),
            rarity: payload.rarity,
            image_file_id: payload.imageFileId?.trim() || null,
            energy_cost: Number(payload.energyCost),
            element_values: normalizeElementValues(payload.elementValues),
            abilities: normalizeAbilities(payload.abilities),
        })
        .select("id,name,rarity,image_file_id,image_url,energy_cost,element_values,abilities,created_at,updated_at")
        .single<SupabaseAttackRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar ataques (veja supabase/schema.sql).`);
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapRow(data);
}

export async function updateAttackById(attackId: string, payload: UpdateAttackRequestDto): Promise<AttackDto> {
    validatePayload(payload);

    const supabase = getSupabaseAdminClient();
    const tableName = getAttacksTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: payload.name.trim(),
            rarity: payload.rarity,
            image_file_id: payload.imageFileId?.trim() || null,
            energy_cost: Number(payload.energyCost),
            element_values: normalizeElementValues(payload.elementValues),
            abilities: normalizeAbilities(payload.abilities),
        })
        .eq("id", attackId)
        .select("id,name,rarity,image_file_id,image_url,energy_cost,element_values,abilities,created_at,updated_at")
        .single<SupabaseAttackRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar ataques (veja supabase/schema.sql).`);
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapRow(data);
}

export async function deleteAttackById(attackId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getAttacksTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", attackId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover ataques (veja supabase/schema.sql).`);
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }
}
