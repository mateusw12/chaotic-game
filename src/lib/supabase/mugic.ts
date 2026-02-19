import {
    type MugicAbilityDto,
    type MugicAbilityType,
    type MugicActionType,
    type MugicStatusEffectActionPayload,
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
import { type CreatureTribe, isValidCardRarity } from "@/dto/creature";
import type { LocationCardType, LocationEffectType, LocationStat } from "@/dto/location";
import { getMugicImagePublicUrl, getSupabaseAdminClient } from "./storage";
import { getMugicTableName, isMissingTableError, isValidTribe } from "./core";
import type { SupabaseApiError, SupabaseMugicRow } from "./types";

function isMissingFileNameColumnError(error: SupabaseApiError): boolean {
    const normalizedMessage = error.message.toLowerCase();

    return (
        (error.code === "42703" || error.code === "PGRST204")
        && (normalizedMessage.includes("file_name") || normalizedMessage.includes("'file_name'"))
    );
}

type RawMugicAbility = Partial<MugicAbilityDto> & {
    abilityType?: MugicAbilityType;
    actionType?: MugicActionType | null;
    effectType?: LocationEffectType | null;
    targetScope?: MugicTargetScope;
    stats?: LocationStat[];
    cardTypes?: LocationCardType[];
    targetTribes?: CreatureTribe[];
};

function isValidStatusEffectActionPayload(payload: unknown): payload is MugicStatusEffectActionPayload {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return false;
    }

    const record = payload as Record<string, unknown>;

    if (record.effectType !== "status_effect") {
        return false;
    }

    if (record.statusType !== "exhaust_disciplines") {
        return false;
    }

    if (record.statScope !== "all_disciplines") {
        return false;
    }

    if (typeof record.value !== "number" || Number.isNaN(record.value) || record.value < 0) {
        return false;
    }

    if (
        record.durationTurns !== undefined
        && record.durationTurns !== null
        && (typeof record.durationTurns !== "number" || Number.isNaN(record.durationTurns) || record.durationTurns < 0)
    ) {
        return false;
    }

    return true;
}

function normalizeAbilities(abilities: Array<RawMugicAbility | MugicAbilityDto>): MugicAbilityDto[] {
    return abilities.map((ability) => {
        const abilityType = ability.abilityType ?? "action";
        const actionType = abilityType === "action" ? (ability.actionType ?? null) : null;
        const actionPayload = abilityType === "action" ? (ability.actionPayload ?? null) : null;

        return {
            abilityType,
            description: ability.description ?? "",
            effectType: ability.effectType ?? null,
            stats: Array.isArray(ability.stats) ? ability.stats : [],
            cardTypes: Array.isArray(ability.cardTypes) ? ability.cardTypes : [],
            targetScope: ability.targetScope ?? "self",
            targetTribes: Array.isArray(ability.targetTribes) ? ability.targetTribes : [],
            value: typeof ability.value === "number" ? ability.value : 0,
            actionType,
            actionPayload,
        };
    });
}

function mapRow(row: SupabaseMugicRow): MugicDto {
    return {
        id: row.id,
        name: row.name,
        fileName: row.file_name ?? null,
        rarity: row.rarity,
        imageFileId: row.image_file_id,
        imageUrl: row.image_file_id ? getMugicImagePublicUrl(row.image_file_id) : row.image_url,
        tribes: row.tribes,
        cost: row.cost,
        abilities: normalizeAbilities(row.abilities as RawMugicAbility[]),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validatePayload(payload: CreateMugicRequestDto | UpdateMugicRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do mugic é obrigatório.");
    }

    if (!isValidCardRarity(payload.rarity)) {
        throw new Error("Raridade inválida.");
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

        if (!Array.isArray(ability.targetTribes)) {
            throw new Error(`Tribos alvo da habilidade #${index + 1} precisam ser uma lista.`);
        }

        const invalidTargetTribe = ability.targetTribes.find((tribe) => !isValidTribe(tribe));
        if (invalidTargetTribe) {
            throw new Error(`Tribo alvo da habilidade #${index + 1} é inválida.`);
        }

        if (ability.abilityType === "action") {
            if (!ability.actionType || !isValidMugicActionType(ability.actionType as MugicActionType)) {
                throw new Error(`Ação da habilidade #${index + 1} é inválida.`);
            }

            if (
                ability.actionPayload !== undefined
                && ability.actionPayload !== null
                && (typeof ability.actionPayload !== "object" || Array.isArray(ability.actionPayload))
            ) {
                throw new Error(`Payload da ação #${index + 1} é inválido.`);
            }

            if (ability.actionType === "apply_status_effect" && !isValidStatusEffectActionPayload(ability.actionPayload)) {
                throw new Error(`Payload de status da habilidade #${index + 1} é inválido.`);
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

    const withFileNameSelect = "id,name,file_name,rarity,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at";
    const fallbackSelect = "id,name,rarity,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at";

    const { data, error } = await supabase
        .from(tableName)
        .select(withFileNameSelect)
        .order("created_at", { ascending: false })
        .returns<SupabaseMugicRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingFileNameColumnError(supabaseError)) {
            const fallback = await supabase
                .from(tableName)
                .select(fallbackSelect)
                .order("created_at", { ascending: false })
                .returns<SupabaseMugicRow[]>();

            if (fallback.error) {
                const fallbackError = fallback.error as SupabaseApiError;
                if (isMissingTableError(fallbackError)) {
                    throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar mugics (veja supabase/schema.sql).`);
                }
                throw new Error(`Erro Supabase [${fallbackError.code ?? "UNKNOWN"}]: ${fallbackError.message}`);
            }

            return (fallback.data ?? []).map(mapRow);
        }

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

    const insertPayload = {
        name: normalizedPayload.name.trim(),
        file_name: normalizedPayload.fileName?.trim() || null,
        rarity: normalizedPayload.rarity,
        image_file_id: normalizedPayload.imageFileId?.trim() || null,
        tribes: normalizedPayload.tribes,
        cost: Number(normalizedPayload.cost),
        abilities: normalizeAbilities(normalizedPayload.abilities),
    };

    const withFileNameSelect = "id,name,file_name,rarity,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at";
    const fallbackSelect = "id,name,rarity,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at";

    const { data, error } = await supabase
        .from(tableName)
        .insert(insertPayload)
        .select(withFileNameSelect)
        .single<SupabaseMugicRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingFileNameColumnError(supabaseError)) {
            const { file_name: _ignored, ...fallbackInsertPayload } = insertPayload;

            const fallback = await supabase
                .from(tableName)
                .insert(fallbackInsertPayload)
                .select(fallbackSelect)
                .single<SupabaseMugicRow>();

            if (fallback.error) {
                const fallbackError = fallback.error as SupabaseApiError;
                if (isMissingTableError(fallbackError)) {
                    throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar mugics (veja supabase/schema.sql).`);
                }
                throw new Error(`Erro Supabase [${fallbackError.code ?? "UNKNOWN"}]: ${fallbackError.message}`);
            }

            return mapRow(fallback.data);
        }

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

    const fileName = normalizedPayload.fileName;
    const updatePayload = {
        name: normalizedPayload.name.trim(),
        ...(fileName !== undefined ? { file_name: fileName?.trim() || null } : {}),
        rarity: normalizedPayload.rarity,
        image_file_id: normalizedPayload.imageFileId?.trim() || null,
        tribes: normalizedPayload.tribes,
        cost: Number(normalizedPayload.cost),
        abilities: normalizeAbilities(normalizedPayload.abilities),
    };

    const withFileNameSelect = "id,name,file_name,rarity,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at";
    const fallbackSelect = "id,name,rarity,image_file_id,image_url,tribes,cost,abilities,created_at,updated_at";

    const { data, error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq("id", mugicId)
        .select(withFileNameSelect)
        .single<SupabaseMugicRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingFileNameColumnError(supabaseError)) {
            const fallbackUpdatePayload = { ...updatePayload } as Record<string, unknown>;
            delete fallbackUpdatePayload.file_name;

            const fallback = await supabase
                .from(tableName)
                .update(fallbackUpdatePayload)
                .eq("id", mugicId)
                .select(fallbackSelect)
                .single<SupabaseMugicRow>();

            if (fallback.error) {
                const fallbackError = fallback.error as SupabaseApiError;
                if (isMissingTableError(fallbackError)) {
                    throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar mugics (veja supabase/schema.sql).`);
                }
                throw new Error(`Erro Supabase [${fallbackError.code ?? "UNKNOWN"}]: ${fallbackError.message}`);
            }

            return mapRow(fallback.data);
        }

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

export async function updateMugicImageFileById(
    mugicId: string,
    imageFileId: string | null,
): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getMugicTableName();

    const { error } = await supabase
        .from(tableName)
        .update({ image_file_id: imageFileId?.trim() || null })
        .eq("id", mugicId);

    if (error) {
        const supabaseError = error as SupabaseApiError;
        if (isMissingTableError(supabaseError)) {
            throw new Error(`Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de atualizar imagens (veja supabase/schema.sql).`);
        }
        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }
}
