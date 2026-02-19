import {
    isValidCardRarity,
    type CreateCreatureRequestDto,
    type CreatureDto,
    type UpdateCreatureRequestDto,
} from "@/dto/creature";
import { getCreatureImagePublicUrl, getSupabaseAdminClient } from "../storage";
import {
    getCreaturesTableName,
    getAbilitiesTableName,
    isMissingTableError,
    isValidElement,
    isValidTribe,
} from "../core";
import { getAbilityById } from "../abilities";
import type {
    SupabaseApiError,
    SupabaseAbilityRow,
    SupabaseCreatureRow,
} from "../types";

type BaseCreatureRow = Omit<
    SupabaseCreatureRow,
    "support_ability_name" | "brainwashed_ability_name"
>;

type LegacyCreatureRow = Omit<
    BaseCreatureRow,
    "support_ability_ids" | "brainwashed_ability_ids"
> & {
    support_ability_id: string | null;
    brainwashed_ability_id: string | null;
};

function isMissingAbilityArrayColumnsError(error: SupabaseApiError): boolean {
    return (
        error.code === "42703"
        && (
            error.message.includes("support_ability_ids")
            || error.message.includes("brainwashed_ability_ids")
        )
    );
}

function normalizeElementValues(value: unknown): BaseCreatureRow["dominant_elements"] {
    if (Array.isArray(value)) {
        return value.filter((item): item is BaseCreatureRow["dominant_elements"][number] => typeof item === "string");
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is BaseCreatureRow["dominant_elements"][number] => typeof item === "string");
            }
        } catch {
            return [];
        }
    }

    return [];
}

function normalizeAbilityIds(value: string[] | string | null | undefined): string[] {
    if (Array.isArray(value)) {
        return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
    }

    if (typeof value === "string" && value.trim()) {
        const trimmed = value.trim();

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
                const parsed = JSON.parse(trimmed);

                if (Array.isArray(parsed)) {
                    return Array.from(
                        new Set(
                            parsed
                                .filter((item): item is string => typeof item === "string")
                                .map((item) => item.trim())
                                .filter(Boolean),
                        ),
                    );
                }
            } catch {
                return [];
            }
        }

        return [trimmed];
    }

    return [];
}

function mapAbilityNames(abilityIds: string[], abilityNameById: Map<string, string>): string[] {
    return abilityIds
        .map((abilityId) => abilityNameById.get(abilityId))
        .filter((abilityName): abilityName is string => Boolean(abilityName));
}

async function loadAbilityNameMap(abilityIds: string[]): Promise<Map<string, string>> {
    if (abilityIds.length === 0) {
        return new Map<string, string>();
    }

    const supabase = getSupabaseAdminClient();
    const abilitiesTable = getAbilitiesTableName();

    const { data, error } = await supabase
        .from(abilitiesTable)
        .select("id,name")
        .in("id", abilityIds)
        .returns<Array<Pick<SupabaseAbilityRow, "id" | "name">>>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${abilitiesTable}. Crie a tabela de habilidades antes de vincular criaturas (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    return new Map((data ?? []).map((ability) => [ability.id, ability.name]));
}

async function validateAbilityIdsByCategory(
    abilityIds: string[],
    category: "support" | "brainwashed",
): Promise<void> {
    for (const abilityId of abilityIds) {
        const ability = await getAbilityById(abilityId);

        if (!ability) {
            throw new Error(`Habilidade ${category} não encontrada.`);
        }

        if (ability.category !== category) {
            throw new Error(`A habilidade selecionada não é do tipo ${category}.`);
        }
    }
}

function normalizeBaseCreatureRow(row: BaseCreatureRow): BaseCreatureRow {
    return {
        ...row,
        dominant_elements: normalizeElementValues(row.dominant_elements),
        support_ability_ids: normalizeAbilityIds(row.support_ability_ids),
        brainwashed_ability_ids: normalizeAbilityIds(row.brainwashed_ability_ids),
    };
}

function mapLegacyCreatureRow(row: LegacyCreatureRow): BaseCreatureRow {
    return {
        ...row,
        dominant_elements: normalizeElementValues(row.dominant_elements),
        support_ability_ids: normalizeAbilityIds(row.support_ability_id),
        brainwashed_ability_ids: normalizeAbilityIds(row.brainwashed_ability_id),
    };
}

function mapSupabaseCreatureRow(row: SupabaseCreatureRow): CreatureDto {
    const resolvedImageUrl = row.image_file_id
        ? getCreatureImagePublicUrl(row.image_file_id)
        : row.image_url;

    return {
        id: row.id,
        name: row.name,
        fileName: row.file_name,
        rarity: row.rarity,
        imageFileId: row.image_file_id,
        imageUrl: resolvedImageUrl,
        tribe: row.tribe,
        power: row.power,
        courage: row.courage,
        speed: row.speed,
        wisdom: row.wisdom,
        mugic: row.mugic,
        energy: row.energy,
        dominantElements: row.dominant_elements,
        supportAbilityId: row.support_ability_ids,
        supportAbilityName: row.support_ability_name,
        brainwashedAbilityId: row.brainwashed_ability_ids,
        brainwashedAbilityName: row.brainwashed_ability_name,
        equipmentNote: row.equipment_note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listCreatures(): Promise<CreatureDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const listWithArrayColumns = async () => {
        const { data, error } = await supabase
            .from(tableName)
            .select(
                "id,name,file_name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_ids,brainwashed_ability_ids,equipment_note,created_at,updated_at",
            )
            .order("created_at", { ascending: false })
            .returns<BaseCreatureRow[]>();

        return { data, error };
    };

    const listWithLegacyColumns = async () => {
        const { data, error } = await supabase
            .from(tableName)
            .select(
                "id,name,file_name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at",
            )
            .order("created_at", { ascending: false })
            .returns<LegacyCreatureRow[]>();

        return { data, error };
    };

    const { data, error } = await listWithArrayColumns();

    if (error && isMissingAbilityArrayColumnsError(error as SupabaseApiError)) {
        const legacyResult = await listWithLegacyColumns();

        if (legacyResult.error) {
            const legacyError = legacyResult.error as SupabaseApiError;

            if (isMissingTableError(legacyError)) {
                throw new Error(
                    `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar criaturas (veja supabase/schema.sql).`,
                );
            }

            throw new Error(
                `Erro Supabase [${legacyError.code ?? "UNKNOWN"}]: ${legacyError.message}`,
            );
        }

        const normalizedRows = (legacyResult.data ?? []).map(mapLegacyCreatureRow);

        const allAbilityIds = Array.from(
            new Set(
                normalizedRows.flatMap((row) => [
                    ...row.support_ability_ids,
                    ...row.brainwashed_ability_ids,
                ]),
            ),
        );

        const abilityNameById = await loadAbilityNameMap(allAbilityIds);

        return normalizedRows.map((row) =>
            mapSupabaseCreatureRow({
                ...row,
                support_ability_name: mapAbilityNames(
                    row.support_ability_ids,
                    abilityNameById,
                ),
                brainwashed_ability_name: mapAbilityNames(
                    row.brainwashed_ability_ids,
                    abilityNameById,
                ),
            }),
        );
    }

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar criaturas (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    const normalizedRows: BaseCreatureRow[] = (data ?? []).map(normalizeBaseCreatureRow);

    const allAbilityIds = Array.from(
        new Set(
            normalizedRows.flatMap((row) => [
                ...row.support_ability_ids,
                ...row.brainwashed_ability_ids,
            ]),
        ),
    );

    const abilityNameById = await loadAbilityNameMap(allAbilityIds);

    return normalizedRows.map((row) =>
        mapSupabaseCreatureRow({
            ...row,
            support_ability_name: mapAbilityNames(
                row.support_ability_ids,
                abilityNameById,
            ),
            brainwashed_ability_name: mapAbilityNames(
                row.brainwashed_ability_ids,
                abilityNameById,
            ),
        }),
    );
}

export async function createCreature(
    payload: CreateCreatureRequestDto,
): Promise<CreatureDto> {
    if (!payload.name.trim()) {
        throw new Error("Nome da criatura é obrigatório.");
    }

    if (!isValidCardRarity(payload.rarity)) {
        throw new Error("Raridade inválida.");
    }

    if (!isValidTribe(payload.tribe)) {
        throw new Error("Tribo inválida.");
    }

    if (payload.dominantElements.length === 0) {
        throw new Error("Selecione ao menos 1 elemento dominante.");
    }

    const invalidElement = payload.dominantElements.find(
        (element) => !isValidElement(element),
    );

    if (invalidElement) {
        throw new Error("Elemento dominante inválido.");
    }

    const statFields = [
        payload.power,
        payload.courage,
        payload.speed,
        payload.wisdom,
        payload.mugic,
        payload.energy,
    ];

    if (statFields.some((value) => value < 0)) {
        throw new Error("Os atributos da criatura não podem ser negativos.");
    }

    const supportAbilityIds = normalizeAbilityIds(payload.supportAbilityId);
    const brainwashedAbilityIds = normalizeAbilityIds(payload.brainwashedAbilityId);

    await validateAbilityIdsByCategory(supportAbilityIds, "support");
    await validateAbilityIdsByCategory(brainwashedAbilityIds, "brainwashed");

    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: payload.name.trim(),
            file_name: payload.fileName?.trim() || null,
            rarity: payload.rarity,
            image_file_id: payload.imageFileId?.trim() || null,
            tribe: payload.tribe,
            power: payload.power,
            courage: payload.courage,
            speed: payload.speed,
            wisdom: payload.wisdom,
            mugic: payload.mugic,
            energy: payload.energy,
            dominant_elements: payload.dominantElements,
            support_ability_ids: supportAbilityIds,
            brainwashed_ability_ids: brainwashedAbilityIds,
            equipment_note: payload.equipmentNote?.trim() || null,
        })
        .select(
            "id,name,file_name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_ids,brainwashed_ability_ids,equipment_note,created_at,updated_at",
        )
        .single<BaseCreatureRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar criaturas (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    const abilityNameById = await loadAbilityNameMap([
        ...supportAbilityIds,
        ...brainwashedAbilityIds,
    ]);

    return mapSupabaseCreatureRow({
        ...data,
        support_ability_name: mapAbilityNames(supportAbilityIds, abilityNameById),
        brainwashed_ability_name: mapAbilityNames(
            brainwashedAbilityIds,
            abilityNameById,
        ),
    });
}

export async function updateCreatureById(
    creatureId: string,
    payload: UpdateCreatureRequestDto,
): Promise<CreatureDto> {
    if (!payload.name.trim()) {
        throw new Error("Nome da criatura é obrigatório.");
    }

    if (!isValidCardRarity(payload.rarity)) {
        throw new Error("Raridade inválida.");
    }

    if (!isValidTribe(payload.tribe)) {
        throw new Error("Tribo inválida.");
    }

    if (payload.dominantElements.length === 0) {
        throw new Error("Selecione ao menos 1 elemento dominante.");
    }

    const invalidElement = payload.dominantElements.find(
        (element) => !isValidElement(element),
    );

    if (invalidElement) {
        throw new Error("Elemento dominante inválido.");
    }

    const statFields = [
        payload.power,
        payload.courage,
        payload.speed,
        payload.wisdom,
        payload.mugic,
        payload.energy,
    ];

    if (statFields.some((value) => value < 0)) {
        throw new Error("Os atributos da criatura não podem ser negativos.");
    }

    const supportAbilityIds = normalizeAbilityIds(payload.supportAbilityId);
    const brainwashedAbilityIds = normalizeAbilityIds(payload.brainwashedAbilityId);

    await validateAbilityIdsByCategory(supportAbilityIds, "support");
    await validateAbilityIdsByCategory(brainwashedAbilityIds, "brainwashed");

    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: payload.name.trim(),
            file_name: payload.fileName?.trim() || null,
            rarity: payload.rarity,
            image_file_id: payload.imageFileId?.trim() || null,
            tribe: payload.tribe,
            power: payload.power,
            courage: payload.courage,
            speed: payload.speed,
            wisdom: payload.wisdom,
            mugic: payload.mugic,
            energy: payload.energy,
            dominant_elements: payload.dominantElements,
            support_ability_ids: supportAbilityIds,
            brainwashed_ability_ids: brainwashedAbilityIds,
            equipment_note: payload.equipmentNote?.trim() || null,
        })
        .eq("id", creatureId)
        .select(
            "id,name,file_name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_ids,brainwashed_ability_ids,equipment_note,created_at,updated_at",
        )
        .single<BaseCreatureRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar criaturas (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }

    const abilityNameById = await loadAbilityNameMap([
        ...supportAbilityIds,
        ...brainwashedAbilityIds,
    ]);

    return mapSupabaseCreatureRow({
        ...data,
        support_ability_name: mapAbilityNames(supportAbilityIds, abilityNameById),
        brainwashed_ability_name: mapAbilityNames(
            brainwashedAbilityIds,
            abilityNameById,
        ),
    });
}

export async function deleteCreatureById(creatureId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", creatureId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover criaturas (veja supabase/schema.sql).`,
            );
        }

        throw new Error(
            `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
        );
    }
}

export async function updateCreatureImageFileById(
    creatureId: string,
    imageFileId: string | null,
): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { error } = await supabase
        .from(tableName)
        .update({ image_file_id: imageFileId?.trim() || null })
        .eq("id", creatureId);

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
