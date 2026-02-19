import {
    type CreateLocationRequestDto,
    type LocationBattleRuleDto,
    type LocationCardType,
    type LocationDto,
    type LocationEffectType,
    type LocationStat,
    type LocationTargetScope,
    type UpdateLocationRequestDto,
} from "@/dto/location";
import { isValidCardRarity, type CreatureElement, type CreatureTribe } from "@/dto/creature";
import { getLocationImagePublicUrl, getSupabaseAdminClient } from "../storage";
import {
    getLocationsTableName,
    isValidLocationBattleRuleType,
    isMissingTableError,
    isValidLocationInitiativeElement,
    isValidLocationCardType,
    isValidLocationEffectType,
    isValidLocationStat,
    isValidLocationTargetScope,
    isValidTribe,
} from "../core";
import type { SupabaseApiError, SupabaseLocationRow } from "../types";

const DB_ALLOWED_INITIATIVE_ELEMENTS = new Set<CreatureElement>([
    "fire",
    "water",
    "earth",
    "air",
]);

const INITIATIVE_ALIAS_TO_ELEMENT: Record<string, CreatureElement> = {
    power: "fire",
    courage: "earth",
    speed: "air",
    wisdom: "water",
    overworld: "air",
    underworld: "fire",
    mipedian: "air",
    marrillian: "water",
    danian: "earth",
    ancient: "earth",
    past: "fire",
    elementalist: "water",
    build_cost: "earth",
    mugic_counters: "water",
    number_of_elements: "air",
    fewest_elements: "air",
};

function normalizeInitiativeForDb(values: string[]): CreatureElement[] {
    const normalized = values
        .map((value) => value.trim().toLowerCase())
        .map((value) => {
            if (DB_ALLOWED_INITIATIVE_ELEMENTS.has(value as CreatureElement)) {
                return value as CreatureElement;
            }

            return INITIATIVE_ALIAS_TO_ELEMENT[value] ?? "air";
        });

    const unique = [...new Set(normalized)];

    if (unique.length > 0) {
        return unique;
    }

    return ["air"];
}

type LegacyLocationAbility = {
    description: string;
    effectType: LocationEffectType;
    targetScope?: LocationTargetScope;
    targetTribes?: CreatureTribe[];
    value: number;
    stats?: LocationStat[];
    stat?: LocationStat;
    cardTypes?: LocationCardType[];
    battleRules?: LocationBattleRuleDto | null;
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
            targetScope: ability.targetScope ?? "all_creatures",
            targetTribes: Array.isArray(ability.targetTribes) ? ability.targetTribes : [],
            stats,
            cardTypes: Array.isArray(ability.cardTypes) ? ability.cardTypes : [],
            value: ability.value,
            battleRules: ability.battleRules ?? null,
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
        fileName: row.file_name,
        rarity: row.rarity,
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

    if (!isValidCardRarity(payload.rarity)) {
        throw new Error("Raridade inválida.");
    }

    if (!Array.isArray(payload.initiativeElements) || payload.initiativeElements.length === 0) {
        throw new Error("Selecione ao menos 1 elemento de initiative.");
    }

    const invalidInitiative = payload.initiativeElements.find((item) => !isValidLocationInitiativeElement(item));

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

        if (!isValidLocationTargetScope((ability.targetScope ?? "all_creatures") as LocationTargetScope)) {
            throw new Error(`Escopo da habilidade #${index + 1} é inválido.`);
        }

        const targetTribes = Array.isArray(ability.targetTribes) ? ability.targetTribes : [];
        const invalidTargetTribe = targetTribes.find((tribe) => !isValidTribe(tribe));

        if (invalidTargetTribe) {
            throw new Error(`Tribo alvo da habilidade #${index + 1} é inválida.`);
        }

        if ((ability.targetScope ?? "all_creatures") === "specific_tribes" && targetTribes.length === 0) {
            throw new Error(`Selecione ao menos 1 tribo alvo na habilidade #${index + 1}.`);
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

        if (ability.battleRules !== undefined && ability.battleRules !== null) {
            if (typeof ability.battleRules !== "object" || Array.isArray(ability.battleRules)) {
                throw new Error(`Regra de batalha da habilidade #${index + 1} é inválida.`);
            }

            if (!isValidLocationBattleRuleType(ability.battleRules.type)) {
                throw new Error(`Tipo de regra de batalha da habilidade #${index + 1} é inválido.`);
            }
        }
    });
}

export async function listLocations(): Promise<LocationDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getLocationsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,file_name,rarity,image_file_id,image_url,initiative_elements,tribes,abilities,created_at,updated_at")
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
            file_name: payload.fileName?.trim() || null,
            rarity: payload.rarity,
            image_file_id: payload.imageFileId?.trim() || null,
            initiative_elements: normalizeInitiativeForDb(payload.initiativeElements),
            tribes: payload.tribes ?? [],
            abilities: normalizedAbilities,
        })
        .select("id,name,file_name,rarity,image_file_id,image_url,initiative_elements,tribes,abilities,created_at,updated_at")
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
            file_name: payload.fileName?.trim() || null,
            rarity: payload.rarity,
            image_file_id: payload.imageFileId?.trim() || null,
            initiative_elements: normalizeInitiativeForDb(payload.initiativeElements),
            tribes: payload.tribes ?? [],
            abilities: normalizedAbilities,
        })
        .eq("id", locationId)
        .select("id,name,file_name,rarity,image_file_id,image_url,initiative_elements,tribes,abilities,created_at,updated_at")
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

export async function updateLocationImageFileById(
    locationId: string,
    imageFileId: string | null,
): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getLocationsTableName();

    const { error } = await supabase
        .from(tableName)
        .update({ image_file_id: imageFileId?.trim() || null })
        .eq("id", locationId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de atualizar imagens (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }
}
