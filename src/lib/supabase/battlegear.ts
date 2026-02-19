import {
    type BattleGearAbilityDto,
    type BattleGearBattleRuleDto,
    type BattleGearDto,
    type CreateBattleGearRequestDto,
    type UpdateBattleGearRequestDto,
} from "@/dto/battlegear";
import { isValidCardRarity } from "@/dto/creature";
import {
    type LocationCardType,
    type LocationStat,
} from "@/dto/location";
import { getBattlegearImagePublicUrl, getSupabaseAdminClient } from "./storage";
import {
    getBattlegearTableName,
    isMissingTableError,
    isValidBattleGearBattleRuleType,
    isValidBattleGearEffectType,
    isValidBattleGearTargetScope,
    isValidLocationCardType,
    isValidLocationStat,
    isValidTribe,
} from "./core";
import type { SupabaseApiError, SupabaseBattleGearRow } from "./types";

type BattleGearAbilityInput = Partial<BattleGearAbilityDto> & {
    stat?: LocationStat;
    battleRules?: BattleGearBattleRuleDto | null;
};

function isMissingFileNameColumnError(error: SupabaseApiError): boolean {
    const normalizedMessage = error.message.toLowerCase();

    return (
        (error.code === "42703" || error.code === "PGRST204")
        && (normalizedMessage.includes("file_name") || normalizedMessage.includes("'file_name'"))
    );
}

function normalizeAbilities(abilities: BattleGearAbilityInput[]): CreateBattleGearRequestDto["abilities"] {
    return abilities.map((ability) => {
        const stats = Array.isArray(ability.stats)
            ? ability.stats
            : ability.stat
                ? [ability.stat]
                : [];

        const targetScope = typeof ability.targetScope === "string" ? ability.targetScope : "all_creatures";
        const battleRules = ability.battleRules && typeof ability.battleRules === "object" && !Array.isArray(ability.battleRules)
            ? {
                type: ability.battleRules.type,
                requiresTarget: ability.battleRules.requiresTarget,
                usageLimitPerTurn: ability.battleRules.usageLimitPerTurn ?? null,
                notes: ability.battleRules.notes ?? null,
                payload:
                    ability.battleRules.payload
                        && typeof ability.battleRules.payload === "object"
                        && !Array.isArray(ability.battleRules.payload)
                        ? ability.battleRules.payload
                        : null,
            }
            : null;

        return {
            description: String(ability.description ?? ""),
            effectType: String(ability.effectType ?? "special") as CreateBattleGearRequestDto["abilities"][number]["effectType"],
            targetScope: targetScope as CreateBattleGearRequestDto["abilities"][number]["targetScope"],
            targetTribes: Array.isArray(ability.targetTribes) ? ability.targetTribes : [],
            stats,
            cardTypes: Array.isArray(ability.cardTypes) ? ability.cardTypes : [],
            value: typeof ability.value === "number" && Number.isFinite(ability.value) ? ability.value : 0,
            battleRules,
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
        fileName: row.file_name ?? null,
        rarity: row.rarity,
        imageFileId: row.image_file_id,
        imageUrl: resolvedImageUrl,
        allowedTribes: row.allowed_tribes,
        allowedCreatureIds: row.allowed_creature_ids,
        abilities: normalizeAbilities(Array.isArray(row.abilities) ? row.abilities as BattleGearAbilityInput[] : []),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validatePayload(payload: CreateBattleGearRequestDto | UpdateBattleGearRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do equipamento é obrigatório.");
    }

    if (!isValidCardRarity(payload.rarity)) {
        throw new Error("Raridade inválida.");
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

        if (!isValidBattleGearEffectType(ability.effectType)) {
            throw new Error(`Tipo da habilidade #${index + 1} é inválido.`);
        }

        if (!isValidBattleGearTargetScope(ability.targetScope)) {
            throw new Error(`Escopo da habilidade #${index + 1} é inválido.`);
        }

        if (!Array.isArray(ability.targetTribes)) {
            throw new Error(`As tribos alvo da habilidade #${index + 1} precisam ser uma lista.`);
        }

        const invalidTargetTribe = ability.targetTribes.find((tribe) => !isValidTribe(tribe));

        if (invalidTargetTribe) {
            throw new Error(`Tribo alvo da habilidade #${index + 1} é inválida.`);
        }

        if (!Array.isArray(ability.stats)) {
            throw new Error(`Atributos da habilidade #${index + 1} precisam ser uma lista.`);
        }

        if (ability.stats.length === 0) {
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
                throw new Error(`A regra de batalha da habilidade #${index + 1} precisa ser um objeto.`);
            }

            if (!isValidBattleGearBattleRuleType(ability.battleRules.type)) {
                throw new Error(`Tipo da regra de batalha da habilidade #${index + 1} é inválido.`);
            }

            if (
                ability.battleRules.payload !== undefined
                && ability.battleRules.payload !== null
                && (typeof ability.battleRules.payload !== "object" || Array.isArray(ability.battleRules.payload))
            ) {
                throw new Error(`Payload da regra de batalha da habilidade #${index + 1} precisa ser um objeto.`);
            }
        }
    });
}

export async function listBattleGear(): Promise<BattleGearDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getBattlegearTableName();

    const withFileNameSelect = "id,name,file_name,rarity,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at";
    const fallbackSelect = "id,name,rarity,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at";

    const { data, error } = await supabase
        .from(tableName)
        .select(withFileNameSelect)
        .order("created_at", { ascending: false })
        .returns<SupabaseBattleGearRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingFileNameColumnError(supabaseError)) {
            const fallback = await supabase
                .from(tableName)
                .select(fallbackSelect)
                .order("created_at", { ascending: false })
                .returns<SupabaseBattleGearRow[]>();

            if (fallback.error) {
                const fallbackError = fallback.error as SupabaseApiError;

                if (isMissingTableError(fallbackError)) {
                    throw new Error(
                        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar equipamentos (veja supabase/schema.sql).`,
                    );
                }

                throw new Error(`Erro Supabase [${fallbackError.code ?? "UNKNOWN"}]: ${fallbackError.message}`);
            }

            return (fallback.data ?? []).map(mapRow);
        }

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

    const insertPayload = {
        name: normalizedPayload.name.trim(),
        file_name: normalizedPayload.fileName?.trim() || null,
        rarity: normalizedPayload.rarity,
        image_file_id: normalizedPayload.imageFileId?.trim() || null,
        allowed_tribes: normalizedPayload.allowedTribes,
        allowed_creature_ids: normalizedPayload.allowedCreatureIds,
        abilities: normalizeAbilities(normalizedPayload.abilities),
    };

    const withFileNameSelect = "id,name,file_name,rarity,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at";
    const fallbackSelect = "id,name,rarity,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at";

    const { data, error } = await supabase
        .from(tableName)
        .insert(insertPayload)
        .select(withFileNameSelect)
        .single<SupabaseBattleGearRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingFileNameColumnError(supabaseError)) {
            const { file_name: _ignored, ...fallbackInsertPayload } = insertPayload;

            const fallback = await supabase
                .from(tableName)
                .insert(fallbackInsertPayload)
                .select(fallbackSelect)
                .single<SupabaseBattleGearRow>();

            if (fallback.error) {
                const fallbackError = fallback.error as SupabaseApiError;

                if (isMissingTableError(fallbackError)) {
                    throw new Error(
                        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar equipamentos (veja supabase/schema.sql).`,
                    );
                }

                throw new Error(`Erro Supabase [${fallbackError.code ?? "UNKNOWN"}]: ${fallbackError.message}`);
            }

            return mapRow(fallback.data);
        }

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

    const fileName = normalizedPayload.fileName;

    const updatePayload = {
        name: normalizedPayload.name.trim(),
        ...(fileName !== undefined ? { file_name: fileName?.trim() || null } : {}),
        rarity: normalizedPayload.rarity,
        image_file_id: normalizedPayload.imageFileId?.trim() || null,
        allowed_tribes: normalizedPayload.allowedTribes,
        allowed_creature_ids: normalizedPayload.allowedCreatureIds,
        abilities: normalizeAbilities(normalizedPayload.abilities),
    };

    const withFileNameSelect = "id,name,file_name,rarity,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at";
    const fallbackSelect = "id,name,rarity,image_file_id,image_url,allowed_tribes,allowed_creature_ids,abilities,created_at,updated_at";

    const { data, error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq("id", battleGearId)
        .select(withFileNameSelect)
        .single<SupabaseBattleGearRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingFileNameColumnError(supabaseError)) {
            const fallbackUpdatePayload = { ...updatePayload } as Record<string, unknown>;
            delete fallbackUpdatePayload.file_name;

            const fallback = await supabase
                .from(tableName)
                .update(fallbackUpdatePayload)
                .eq("id", battleGearId)
                .select(fallbackSelect)
                .single<SupabaseBattleGearRow>();

            if (fallback.error) {
                const fallbackError = fallback.error as SupabaseApiError;

                if (isMissingTableError(fallbackError)) {
                    throw new Error(
                        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar equipamentos (veja supabase/schema.sql).`,
                    );
                }

                throw new Error(`Erro Supabase [${fallbackError.code ?? "UNKNOWN"}]: ${fallbackError.message}`);
            }

            return mapRow(fallback.data);
        }

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

export async function updateBattleGearImageFileById(
    battleGearId: string,
    imageFileId: string | null,
): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getBattlegearTableName();

    const { error } = await supabase
        .from(tableName)
        .update({ image_file_id: imageFileId?.trim() || null })
        .eq("id", battleGearId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de atualizar imagens (veja supabase/schema.sql).`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }
}
