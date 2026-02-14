import {
    isValidCardRarity,
    type CreateCreatureRequestDto,
    type CreatureDto,
    type UpdateCreatureRequestDto,
} from "@/dto/creature";
import { getCreatureImagePublicUrl, getSupabaseAdminClient } from "./storage";
import {
    getCreaturesTableName,
    isMissingTableError,
    isValidElement,
    isValidTribe,
} from "./core";
import { getAbilityById } from "./abilities";
import type {
    SupabaseApiError,
    SupabaseCreatureRow,
} from "./types";

function mapSupabaseCreatureRow(row: SupabaseCreatureRow): CreatureDto {
    const resolvedImageUrl = row.image_file_id
        ? getCreatureImagePublicUrl(row.image_file_id)
        : row.image_url;

    return {
        id: row.id,
        name: row.name,
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
        supportAbilityId: row.support_ability_id,
        supportAbilityName: row.support_ability_name,
        brainwashedAbilityId: row.brainwashed_ability_id,
        brainwashedAbilityName: row.brainwashed_ability_name,
        equipmentNote: row.equipment_note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listCreatures(): Promise<CreatureDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select(
            "id,name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at,support_ability:abilities!creatures_support_ability_id_fkey(name),brainwashed_ability:abilities!creatures_brainwashed_ability_id_fkey(name)",
        )
        .order("created_at", { ascending: false })
        .returns<
            Array<
                Omit<SupabaseCreatureRow, "support_ability_name" | "brainwashed_ability_name"> & {
                    support_ability: { name: string } | null;
                    brainwashed_ability: { name: string } | null;
                }
            >
        >();

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

    const normalizedRows: SupabaseCreatureRow[] = (data ?? []).map((row) => ({
        ...row,
        support_ability_name: row.support_ability?.name ?? null,
        brainwashed_ability_name: row.brainwashed_ability?.name ?? null,
    }));

    return normalizedRows.map(mapSupabaseCreatureRow);
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

    if (payload.supportAbilityId) {
        const supportAbility = await getAbilityById(payload.supportAbilityId);

        if (!supportAbility) {
            throw new Error("Habilidade de suporte não encontrada.");
        }

        if (supportAbility.category !== "support") {
            throw new Error("A habilidade selecionada não é do tipo support.");
        }
    }

    if (payload.brainwashedAbilityId) {
        const brainwashedAbility = await getAbilityById(payload.brainwashedAbilityId);

        if (!brainwashedAbility) {
            throw new Error("Habilidade brainwashed não encontrada.");
        }

        if (brainwashedAbility.category !== "brainwashed") {
            throw new Error("A habilidade selecionada não é do tipo brainwashed.");
        }
    }

    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: payload.name.trim(),
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
            support_ability_id: payload.supportAbilityId ?? null,
            brainwashed_ability_id: payload.brainwashedAbilityId ?? null,
            equipment_note: payload.equipmentNote?.trim() || null,
        })
        .select(
            "id,name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at,support_ability:abilities!creatures_support_ability_id_fkey(name),brainwashed_ability:abilities!creatures_brainwashed_ability_id_fkey(name)",
        )
        .single<
            Omit<SupabaseCreatureRow, "support_ability_name" | "brainwashed_ability_name"> & {
                support_ability: { name: string } | null;
                brainwashed_ability: { name: string } | null;
            }
        >();

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

    return mapSupabaseCreatureRow({
        ...data,
        support_ability_name: data.support_ability?.name ?? null,
        brainwashed_ability_name: data.brainwashed_ability?.name ?? null,
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

    if (payload.supportAbilityId) {
        const supportAbility = await getAbilityById(payload.supportAbilityId);

        if (!supportAbility) {
            throw new Error("Habilidade de suporte não encontrada.");
        }

        if (supportAbility.category !== "support") {
            throw new Error("A habilidade selecionada não é do tipo support.");
        }
    }

    if (payload.brainwashedAbilityId) {
        const brainwashedAbility = await getAbilityById(payload.brainwashedAbilityId);

        if (!brainwashedAbility) {
            throw new Error("Habilidade brainwashed não encontrada.");
        }

        if (brainwashedAbility.category !== "brainwashed") {
            throw new Error("A habilidade selecionada não é do tipo brainwashed.");
        }
    }

    const supabase = getSupabaseAdminClient();
    const tableName = getCreaturesTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: payload.name.trim(),
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
            support_ability_id: payload.supportAbilityId ?? null,
            brainwashed_ability_id: payload.brainwashedAbilityId ?? null,
            equipment_note: payload.equipmentNote?.trim() || null,
        })
        .eq("id", creatureId)
        .select(
            "id,name,rarity,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at,support_ability:abilities!creatures_support_ability_id_fkey(name),brainwashed_ability:abilities!creatures_brainwashed_ability_id_fkey(name)",
        )
        .single<
            Omit<SupabaseCreatureRow, "support_ability_name" | "brainwashed_ability_name"> & {
                support_ability: { name: string } | null;
                brainwashed_ability: { name: string } | null;
            }
        >();

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

    return mapSupabaseCreatureRow({
        ...data,
        support_ability_name: data.support_ability?.name ?? null,
        brainwashed_ability_name: data.brainwashed_ability?.name ?? null,
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
