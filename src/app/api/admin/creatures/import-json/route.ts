import { NextResponse } from "next/server";
import { isValidCardRarity, type CardRarity, type CreatureElement } from "@/dto/creature";
import abilitiesSeed from "@/components/data/abilities.json";
import creaturesSeed from "@/components/data/creatures.json";
import { auth } from "@/lib/auth";
import { isValidElement, isValidTribe } from "@/lib/supabase/core";
import {
    createCreature,
    getUserByEmail,
    listAbilities,
    listCreatures,
    updateCreatureById,
} from "@/lib/supabase";

type ImportCreaturesResponseDto = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

type SeedCreature = {
    name?: unknown;
    rarity?: unknown;
    imageFileId?: unknown;
    tribe?: unknown;
    power?: unknown;
    courage?: unknown;
    speed?: unknown;
    wisdom?: unknown;
    mugic?: unknown;
    energy?: unknown;
    dominantElements?: unknown;
    support_ability_ids?: unknown;
    brainwashed_ability_ids?: unknown;
    supportAbilityIds?: unknown;
    brainwashedAbilityIds?: unknown;
    supportAbilityId?: unknown;
    brainwashedAbilityId?: unknown;
    equipmentNote?: unknown;
};

type SeedAbility = {
    id?: unknown;
    name?: unknown;
};

const FILE_NAME = "creatures.json";

function normalizeAbilityIds(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }

    return [];
}

function normalizeAbilityName(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.toLowerCase() : null;
}

function getRawSupportAbilityIds(item: SeedCreature): unknown {
    if (item.support_ability_ids !== undefined) {
        return item.support_ability_ids;
    }

    if (item.supportAbilityIds !== undefined) {
        return item.supportAbilityIds;
    }

    return item.supportAbilityId;
}

function getRawBrainwashedAbilityIds(item: SeedCreature): unknown {
    if (item.brainwashed_ability_ids !== undefined) {
        return item.brainwashed_ability_ids;
    }

    if (item.brainwashedAbilityIds !== undefined) {
        return item.brainwashedAbilityIds;
    }

    return item.brainwashedAbilityId;
}

function normalizeElements(value: unknown): CreatureElement[] {
    if (!Array.isArray(value)) {
        return ["fire"];
    }

    const valid = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item): item is CreatureElement => isValidElement(item));

    return valid.length > 0 ? valid : ["fire"];
}

function normalizeNonNegativeInteger(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.floor(parsed);
}

async function ensureAdminBySessionEmail(email: string | null | undefined) {
    if (!email) {
        return { ok: false as const, status: 401, message: "Usuário não autenticado." };
    }

    const user = await getUserByEmail(email);

    if (!user) {
        return { ok: false as const, status: 404, message: "Usuário não encontrado." };
    }

    if (user.role !== "admin") {
        return {
            ok: false as const,
            status: 403,
            message: "Acesso negado. Apenas admin pode importar criaturas.",
        };
    }

    return { ok: true as const };
}

export async function POST() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ImportCreaturesResponseDto = {
                success: false,
                imported: 0,
                updated: 0,
                skipped: 0,
                fileName: FILE_NAME,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const [existingCreatures, existingAbilities] = await Promise.all([
            listCreatures(),
            listAbilities(),
        ]);

        const existingCreatureNames = new Set(
            existingCreatures.map((creature) => creature.name.trim().toLowerCase()),
        );

        const supportAbilityIds = new Set(
            existingAbilities
                .filter((ability) => ability.category === "support")
                .map((ability) => ability.id),
        );

        const brainwashedAbilityIds = new Set(
            existingAbilities
                .filter((ability) => ability.category === "brainwashed")
                .map((ability) => ability.id),
        );

        const supportAbilityIdByName = new Map(
            existingAbilities
                .filter((ability) => ability.category === "support")
                .map((ability) => [ability.name.trim().toLowerCase(), ability.id] as const),
        );

        const brainwashedAbilityIdByName = new Map(
            existingAbilities
                .filter((ability) => ability.category === "brainwashed")
                .map((ability) => [ability.name.trim().toLowerCase(), ability.id] as const),
        );

        const abilityNameBySeedId = new Map<string, string>();

        for (const seedAbility of abilitiesSeed as SeedAbility[]) {
            if (typeof seedAbility.id !== "string") {
                continue;
            }

            const normalizedName = normalizeAbilityName(seedAbility.name);

            if (!normalizedName) {
                continue;
            }

            abilityNameBySeedId.set(seedAbility.id, normalizedName);
        }

        const existingCreatureByName = new Map(
            existingCreatures.map((creature) => [creature.name.trim().toLowerCase(), creature]),
        );

        const resolveAbilityIds = (
            rawIds: string[],
            allowedIds: Set<string>,
            idByName: Map<string, string>,
        ) => {
            const resolved = new Set<string>();

            for (const rawId of rawIds) {
                if (allowedIds.has(rawId)) {
                    resolved.add(rawId);
                    continue;
                }

                const abilityName = abilityNameBySeedId.get(rawId);

                if (!abilityName) {
                    continue;
                }

                const resolvedId = idByName.get(abilityName);

                if (resolvedId) {
                    resolved.add(resolvedId);
                }
            }

            return Array.from(resolved);
        };

        let imported = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of creaturesSeed as SeedCreature[]) {
            const name = typeof item.name === "string" ? item.name.trim() : "";

            if (!name) {
                skipped += 1;
                continue;
            }

            const normalizedName = name.toLowerCase();

            const tribe = typeof item.tribe === "string" && isValidTribe(item.tribe)
                ? item.tribe
                : null;

            if (!tribe) {
                skipped += 1;
                continue;
            }

            const rarity = typeof item.rarity === "string" && isValidCardRarity(item.rarity)
                ? item.rarity
                : "comum";

            const supportIds = resolveAbilityIds(
                normalizeAbilityIds(getRawSupportAbilityIds(item)),
                supportAbilityIds,
                supportAbilityIdByName,
            );

            const brainwashedIds = resolveAbilityIds(
                normalizeAbilityIds(getRawBrainwashedAbilityIds(item)),
                brainwashedAbilityIds,
                brainwashedAbilityIdByName,
            );

            const imageFileId = typeof item.imageFileId === "string" && item.imageFileId.trim()
                ? item.imageFileId.trim()
                : null;

            const payload = {
                name,
                rarity: rarity as CardRarity,
                imageFileId,
                tribe,
                power: normalizeNonNegativeInteger(item.power),
                courage: normalizeNonNegativeInteger(item.courage),
                speed: normalizeNonNegativeInteger(item.speed),
                wisdom: normalizeNonNegativeInteger(item.wisdom),
                mugic: normalizeNonNegativeInteger(item.mugic),
                energy: normalizeNonNegativeInteger(item.energy),
                dominantElements: normalizeElements(item.dominantElements),
                supportAbilityId: supportIds,
                brainwashedAbilityId: brainwashedIds,
                equipmentNote:
                    typeof item.equipmentNote === "string" && item.equipmentNote.trim()
                        ? item.equipmentNote.trim()
                        : null,
            };

            const existingCreature = existingCreatureByName.get(normalizedName);

            if (existingCreature) {
                await updateCreatureById(existingCreature.id, payload);
                updated += 1;
            } else {
                await createCreature(payload);
                imported += 1;
            }

            existingCreatureNames.add(normalizedName);
        }

        const response: ImportCreaturesResponseDto = {
            success: true,
            imported,
            updated,
            skipped,
            fileName: FILE_NAME,
            message: `${FILE_NAME} importado com sucesso.`,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportCreaturesResponseDto = {
            success: false,
            imported: 0,
            updated: 0,
            skipped: 0,
            fileName: FILE_NAME,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao importar criaturas.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
