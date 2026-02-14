import {
    type CreateLocationRequestDto,
    type LocationCardType,
    type LocationDto,
    type LocationEffectType,
    type LocationStat,
    type UpdateLocationRequestDto,
} from "@/dto/location";
import { getLocationImagePublicUrl, getSupabaseAdminClient } from "./storage";
import {
    getLocationsTableName,
    isMissingTableError,
    isValidElement,
    isValidLocationCardType,
    isValidLocationEffectType,
    isValidLocationStat,
    isValidTribe,
} from "./core";
import type { SupabaseApiError, SupabaseLocationRow } from "./types";

type LegacyLocationAbility = {
    description: string;
    effectType: LocationEffectType;
    value: number;
    stats?: LocationStat[];
    stat?: LocationStat;
    cardTypes?: LocationCardType[];
};

function normalizeLocationAbilities(abilities: LegacyLocationAbility[]): CreateLocationRequestDto["abilities"] {
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

function mapSupabaseLocationRow(row: SupabaseLocationRow): LocationDto {
    const resolvedImageUrl = row.image_file_id
        ? getLocationImagePublicUrl(row.image_file_id)
        : row.image_url;

    const normalizedAbilities = normalizeLocationAbilities(
        row.abilities as unknown as LegacyLocationAbility[],
    );

    return {
        id: row.id,
        name: row.name,
        imageFileId: row.image_file_id,
        imageUrl: resolvedImageUrl,
        initiativeElements: row.initiative_elements,
        tribes: row.tribes,
        abilities: normalizedAbilities,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validateLocationPayload(payload: CreateLocationRequestDto | UpdateLocationRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do local é obrigatório.");
    }

    if (!Array.isArray(payload.initiativeElements) || payload.initiativeElements.length === 0) {
        throw new Error("Selecione ao menos 1 elemento de initiative.");
    }

    const invalidInitiative = payload.initiativeElements.find((item) => !isValidElement(item));

    if (invalidInitiative) {
        throw new Error("Elemento de initiative inválido.");
    }

    if (payload.tribes && !Array.isArray(payload.tribes)) {
        throw new Error("As tribos do local precisam ser uma lista.");
    }

    const invalidTribe = (payload.tribes ?? []).find((item) => !isValidTribe(item));

    if (invalidTribe) {
        throw new Error("Tribo do local inválida.");
    }

    if (!Array.isArray(payload.abilities)) {
        throw new Error("As habilidades do local precisam ser uma lista.");
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

export async function listLocations(): Promise<LocationDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getLocationsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,image_file_id,image_url,initiative_elements,tribes,abilities,created_at,updated_at")
        .order("created_at", { ascending: false })
        .returns<SupabaseLocationRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar locais (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return (data ?? []).map(mapSupabaseLocationRow);
}

export async function createLocation(payload: CreateLocationRequestDto): Promise<LocationDto> {
    validateLocationPayload(payload);
    const normalizedAbilities = normalizeLocationAbilities(payload.abilities as LegacyLocationAbility[]);

    const supabase = getSupabaseAdminClient();
    const tableName = getLocationsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: payload.name.trim(),
            image_file_id: payload.imageFileId?.trim() || null,
            initiative_elements: payload.initiativeElements,
            tribes: payload.tribes ?? [],
            abilities: normalizedAbilities,
        })
        .select("id,name,image_file_id,image_url,initiative_elements,tribes,abilities,created_at,updated_at")
        .single<SupabaseLocationRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar locais (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return mapSupabaseLocationRow(data);
}

export async function updateLocationById(
    locationId: string,
    payload: UpdateLocationRequestDto,
): Promise<LocationDto> {
    validateLocationPayload(payload);
    const normalizedAbilities = normalizeLocationAbilities(payload.abilities as LegacyLocationAbility[]);

    const supabase = getSupabaseAdminClient();
    const tableName = getLocationsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: payload.name.trim(),
            image_file_id: payload.imageFileId?.trim() || null,
            initiative_elements: payload.initiativeElements,
            tribes: payload.tribes ?? [],
            abilities: normalizedAbilities,
        })
        .eq("id", locationId)
        .select("id,name,image_file_id,image_url,initiative_elements,tribes,abilities,created_at,updated_at")
        .single<SupabaseLocationRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar locais (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return mapSupabaseLocationRow(data);
}

export async function deleteLocationById(locationId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getLocationsTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", locationId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover locais (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }
}
