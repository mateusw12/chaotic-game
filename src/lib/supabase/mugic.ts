import {
    type MugicAbilityType,
    type MugicActionType,
    type CreateMugicRequestDto,
    type MugicDto,
    type MugicTargetScope,
    type UpdateMugicRequestDto,
    isValidMugicAbilityType,
    isValidMugicActionType,
    isValidMugicCardType,
    isValidMugicEffectType,
    isValidMugicStat,
    isValidMugicTargetScope,
} from "@/dto/mugic";
import type { LocationCardType, LocationEffectType, LocationStat } from "@/dto/location";
import { getMugicImagePublicUrl, getSupabaseAdminClient } from "./storage";
import { getMugicTableName, isMissingTableError, isValidTribe } from "./core";
import type { SupabaseApiError, SupabaseMugicRow } from "./types";

type LegacyMugicAbility = {
    abilityType?: MugicAbilityType;
    description: string;
    effectType?: LocationEffectType;
    value?: number;
    targetScope?: MugicTargetScope;
    stats?: LocationStat[];
    stat?: LocationStat;
    cardTypes?: LocationCardType[];
    actionType?: MugicActionType;
};

function normalizeAbilities(abilities: LegacyMugicAbility[]): CreateMugicRequestDto["abilities"] {
    return abilities.map((ability) => {
        const abilityType = ability.abilityType ?? "stat_modifier";

        return {
            abilityType,
            description: ability.description,
            effectType: ability.effectType,
            stats: Array.isArray(ability.stats)
                ? ability.stats
                : ability.stat
                    ? [ability.stat]
                    : [],
            cardTypes: Array.isArray(ability.cardTypes) ? ability.cardTypes : [],
            targetScope: ability.targetScope ?? "self",
            value: ability.value,
            actionType: ability.actionType,
        };
    });
}

function mapRow(row: SupabaseMugicRow): MugicDto {
    return {
        id: row.id,
        name: row.name,
        imageFileId: row.image_file_id,
        imageUrl: row.image_file_id ? getMugicImagePublicUrl(row.image_file_id) : row.image_url,
        tribes: row.tribes,
        cost: row.cost,
        abilities: normalizeAbilities(row.abilities as unknown as LegacyMugicAbility[]),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validatePayload(payload: CreateMugicRequestDto | UpdateMugicRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do mugic é obrigatório.");
    }

    if (!Array.isArray(payload.tribes)) {
        throw new Error("As tribos do mugic precisam ser uma lista.");
    }

    const invalidTribe = payload.tribes.find((tribe) => !isValidTribe(tribe));

    if (invalidTribe) {
        throw new Error("Tribo do mugic inválida.");
    }

    if (Number(payload.cost) < 0) {
        throw new Error("Custo do mugic não pode ser negativo.");
    }

    if (!Array.isArray(payload.abilities)) {
        throw new Error("As habilidades do mugic precisam ser uma lista.");
    }

    payload.abilities.forEach((ability, index) => {
        if (!ability.description.trim()) {
            throw new Error(`Descrição da habilidade #${index + 1} é obrigatória.`);
        }

        if (!isValidMugicAbilityType(ability.abilityType as MugicAbilityType)) {
            throw new Error(`Tipo da habilidade #${index + 1} é inválido.`);
        }

        if (!Array.isArray(ability.cardTypes)) {
            throw new Error(`Tipos de carta da habilidade #${index + 1} precisam ser uma lista.`);
        }

        const invalidCardType = ability.cardTypes.find((cardType) => !isValidMugicCardType(cardType as LocationCardType));
        if (invalidCardType) {
            throw new Error(`Tipo de carta da habilidade #${index + 1} é inválido.`);
        }

        if (!isValidMugicTargetScope(ability.targetScope as MugicTargetScope)) {
            throw new Error(`Alvo da habilidade #${index + 1} é inválido.`);
        }

        if (ability.abilityType === "action") {
            if (!ability.actionType || !isValidMugicActionType(ability.actionType as MugicActionType)) {
                throw new Error(`Ação da habilidade #${index + 1} é inválida.`);
            }

            return;
        }

        if (!isValidMugicEffectType(ability.effectType as LocationEffectType)) {
            throw new Error(`Tipo da habilidade #${index + 1} é inválido.`);
        }

        if (!Array.isArray(ability.stats) || ability.stats.length === 0) {
            throw new Error(`Selecione ao menos 1 atributo na habilidade #${index + 1}.`);
        }

        const invalidStat = ability.stats.find((stat) => !isValidMugicStat(stat as LocationStat));
        if (invalidStat) {
            throw new Error(`Atributo da habilidade #${index + 1} é inválido.`);
        }

        if (typeof ability.value !== "number" || Number.isNaN(ability.value) || ability.value < 0) {
            throw new Error(`Valor da habilidade #${index + 1} não pode ser negativo.`);
        }
    });
}

export async function listMugics(): Promise<MugicDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getMugicTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at")
        .order("created_at", { ascending: false })
        .returns<SupabaseMugicRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar mugics (veja supabase/schema.sql).`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return (data ?? []).map(mapRow);
}

export async function createMugic(payload: CreateMugicRequestDto): Promise<MugicDto> {
    const normalizedPayload: CreateMugicRequestDto = {
        ...payload,
        tribes: payload.tribes ?? [],
    };

    validatePayload(normalizedPayload);

    const supabase = getSupabaseAdminClient();
    const tableName = getMugicTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: normalizedPayload.name.trim(),
            image_file_id: normalizedPayload.imageFileId?.trim() || null,
            tribes: normalizedPayload.tribes,
            cost: Number(normalizedPayload.cost),
            abilities: normalizeAbilities(normalizedPayload.abilities as LegacyMugicAbility[]),
        })
        .select("id,name,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at")
        .single<SupabaseMugicRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar mugics (veja supabase/schema.sql).`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapRow(data);
}

export async function updateMugicById(mugicId: string, payload: UpdateMugicRequestDto): Promise<MugicDto> {
    const normalizedPayload: UpdateMugicRequestDto = {
        ...payload,
        tribes: payload.tribes ?? [],
    };

    validatePayload(normalizedPayload);

    const supabase = getSupabaseAdminClient();
    const tableName = getMugicTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: normalizedPayload.name.trim(),
            image_file_id: normalizedPayload.imageFileId?.trim() || null,
            tribes: normalizedPayload.tribes,
            cost: Number(normalizedPayload.cost),
            abilities: normalizeAbilities(normalizedPayload.abilities as LegacyMugicAbility[]),
        })
        .eq("id", mugicId)
        .select("id,name,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at")
        .single<SupabaseMugicRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar mugics (veja supabase/schema.sql).`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapRow(data);
}

export async function deleteMugicById(mugicId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getMugicTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", mugicId);

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover mugics (veja supabase/schema.sql).`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }
}
