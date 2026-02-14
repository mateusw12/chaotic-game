import {
    type BattleGearDto,
    type CreateBattleGearRequestDto,
    type UpdateBattleGearRequestDto,
} from "@/dto/battlegear";
import {
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
} from "@/dto/location";
import { getBattlegearImagePublicUrl, getSupabaseAdminClient } from "./storage";
import {
    getBattlegearTableName,
    isMissingTableError,
    isValidLocationCardType,
    isValidLocationEffectType,
    isValidLocationStat,
    isValidTribe,
} from "./core";
import type { SupabaseApiError, SupabaseBattleGearRow } from "./types";

type LegacyAbility = {
    description: string;
    effectType: LocationEffectType;
    value: number;
    stats?: LocationStat[];
    stat?: LocationStat;
    cardTypes?: LocationCardType[];
};

function normalizeAbilities(abilities: LegacyAbility[]): CreateBattleGearRequestDto["abilities"] {
    return abilities.map((ability) => {
        const stats = Array.isArray(ability.stats)
            ? ability.stats
            : ability.stat
                ? [ability.stat]
                : [];

        return {
            description: ability.description,
            effectType: ability.effectType,
            stats,
            cardTypes: Array.isArray(ability.cardTypes) ? ability.cardTypes : [],
            value: ability.value,
        };
    });
}

function mapRow(row: SupabaseBattleGearRow): BattleGearDto {
    const resolvedImageUrl = row.image_file_id
        ? getBattlegearImagePublicUrl(row.image_file_id)
        : row.image_url;

    return {
        id: row.id,
        name: row.name,
        imageFileId: row.image_file_id,
        imageUrl: resolvedImageUrl,
        allowedTribes: row.allowed_tribes,
        allowedCreatureIds: row.allowed_creature_ids,
        abilities: normalizeAbilities(row.abilities as unknown as LegacyAbility[]),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validatePayload(payload: CreateBattleGearRequestDto | UpdateBattleGearRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do equipamento é obrigatório.");
    }

    if (!Array.isArray(payload.allowedTribes)) {
        throw new Error("As tribos permitidas precisam ser uma lista.");
    }

    const invalidTribe = payload.allowedTribes.find((tribe) => !isValidTribe(tribe));

    if (invalidTribe) {
        throw new Error("Tribo permitida inválida.");
    }

    if (!Array.isArray(payload.allowedCreatureIds)) {
        throw new Error("As criaturas permitidas precisam ser uma lista.");
    }

    if (!Array.isArray(payload.abilities)) {
        throw new Error("As habilidades do equipamento precisam ser uma lista.");
    }

    payload.abilities.forEach((ability, index) => {
        if (!ability.description.trim()) {
            throw new Error(`Descrição da habilidade #${index + 1} é obrigatória.`);
        }

        if (!isValidLocationEffectType(ability.effectType as LocationEffectType)) {
            throw new Error(`Tipo da habilidade #${index + 1} é inválido.`);
        }

        if (!Array.isArray(ability.stats) || ability.stats.length === 0) {
            throw new Error(`Selecione ao menos 1 atributo na habilidade #${index + 1}.`);
        }

        const invalidStat = ability.stats.find((stat) => !isValidLocationStat(stat as LocationStat));

        if (invalidStat) {
            throw new Error(`Atributo da habilidade #${index + 1} é inválido.`);
        }

        if (!Array.isArray(ability.cardTypes)) {
            throw new Error(`Tipos de carta da habilidade #${index + 1} precisam ser uma lista.`);
        }

        const invalidCardType = ability.cardTypes.find(
            (cardType) => !isValidLocationCardType(cardType as LocationCardType),
        );

        if (invalidCardType) {
            throw new Error(`Tipo de carta da habilidade #${index + 1} é inválido.`);
        }

        if (ability.value < 0) {
            throw new Error(`Valor da habilidade #${index + 1} não pode ser negativo.`);
        }
    });
}

export async function listBattleGear(): Promise<BattleGearDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getBattlegearTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at")
        .order("created_at", { ascending: false })
        .returns<SupabaseBattleGearRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar equipamentos (veja supabase/schema.sql).`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return (data ?? []).map(mapRow);
}

export async function createBattleGear(payload: CreateBattleGearRequestDto): Promise<BattleGearDto> {
    const normalizedPayload: CreateBattleGearRequestDto = {
        ...payload,
        allowedTribes: payload.allowedTribes ?? [],
        allowedCreatureIds: payload.allowedCreatureIds ?? [],
    };

    validatePayload(normalizedPayload);

    const supabase = getSupabaseAdminClient();
    const tableName = getBattlegearTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: normalizedPayload.name.trim(),
            image_file_id: normalizedPayload.imageFileId?.trim() || null,
            allowed_tribes: normalizedPayload.allowedTribes,
            allowed_creature_ids: normalizedPayload.allowedCreatureIds,
            abilities: normalizeAbilities(normalizedPayload.abilities as LegacyAbility[]),
        })
        .select("id,name,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at")
        .single<SupabaseBattleGearRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar equipamentos (veja supabase/schema.sql).`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapRow(data);
}

export async function updateBattleGearById(
    battleGearId: string,
    payload: UpdateBattleGearRequestDto,
): Promise<BattleGearDto> {
    const normalizedPayload: UpdateBattleGearRequestDto = {
        ...payload,
        allowedTribes: payload.allowedTribes ?? [],
        allowedCreatureIds: payload.allowedCreatureIds ?? [],
    };

    validatePayload(normalizedPayload);

    const supabase = getSupabaseAdminClient();
    const tableName = getBattlegearTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: normalizedPayload.name.trim(),
            image_file_id: normalizedPayload.imageFileId?.trim() || null,
            allowed_tribes: normalizedPayload.allowedTribes,
            allowed_creature_ids: normalizedPayload.allowedCreatureIds,
            abilities: normalizeAbilities(normalizedPayload.abilities as LegacyAbility[]),
        })
        .eq("id", battleGearId)
        .select("id,name,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at")
        .single<SupabaseBattleGearRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar equipamentos (veja supabase/schema.sql).`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapRow(data);
}

export async function deleteBattleGearById(battleGearId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getBattlegearTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", battleGearId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover equipamentos (veja supabase/schema.sql).`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }
}
