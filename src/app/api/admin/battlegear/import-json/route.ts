import { NextResponse } from "next/server";
import {
    LOCATION_CARD_TYPES,
    LOCATION_EFFECT_TYPES,
    LOCATION_STATS,
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
} from "@/dto/location";
import { CARD_RARITIES, CREATURE_TRIBES, type CardRarity, type CreatureTribe } from "@/dto/creature";
import type { CreateBattleGearRequestDto } from "@/dto/battlegear";
import battlegearSeed from "@/components/data/battlegear.json";
import { auth } from "@/lib/auth";
import {
    createBattleGear,
    getUserByEmail,
    listBattleGear,
    updateBattleGearById,
} from "@/lib/supabase";

type ImportBattlegearResponseDto = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

type SeedAbility = {
    description?: unknown;
    effectType?: unknown;
    effect_type?: unknown;
    stats?: unknown;
    stat?: unknown;
    cardTypes?: unknown;
    card_types?: unknown;
    value?: unknown;
};

type SeedBattleGear = {
    name?: unknown;
    rarity?: unknown;
    image_file_id?: unknown;
    imageFileId?: unknown;
    allowed_tribes?: unknown;
    allowedTribes?: unknown;
    allowed_creature_ids?: unknown;
    allowedCreatureIds?: unknown;
    abilities?: unknown;
};

const FILE_NAME = "battlegear.json";

function parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (!trimmed) {
            return [];
        }

        try {
            const parsed = JSON.parse(trimmed) as unknown;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return [];
}

function normalizeRarity(value: unknown): CardRarity {
    if (typeof value !== "string") {
        return "comum";
    }

    const normalized = value
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("á", "a")
        .replaceAll("â", "a")
        .replaceAll("ã", "a")
        .replaceAll("é", "e")
        .replaceAll("ê", "e")
        .replaceAll("í", "i")
        .replaceAll("ó", "o")
        .replaceAll("ô", "o")
        .replaceAll("õ", "o")
        .replaceAll("ú", "u");

    if (normalized === "super") {
        return "super_rara";
    }

    if (normalized === "ultra") {
        return "ultra_rara";
    }

    if (normalized === "super_raro") {
        return "super_rara";
    }

    if (normalized === "ultra_raro") {
        return "ultra_rara";
    }

    if (CARD_RARITIES.includes(normalized as CardRarity)) {
        return normalized as CardRarity;
    }

    return "comum";
}

function normalizeTribes(value: unknown): CreatureTribe[] {
    const validTribes = new Set<string>(CREATURE_TRIBES);

    return parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is CreatureTribe => validTribes.has(item));
}

function normalizeCardTypes(value: unknown): LocationCardType[] {
    const validCardTypes = new Set<string>(LOCATION_CARD_TYPES);

    return parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .map((item) => (item === "battlegear" ? "equipment" : item))
        .filter((item): item is LocationCardType => validCardTypes.has(item));
}

function inferStatFromDescription(description: string): LocationStat {
    const normalized = description.toLowerCase();

    if (normalized.includes("coragem") || normalized.includes("courage")) {
        return "courage";
    }
    if (normalized.includes("poder") || normalized.includes("power")) {
        return "power";
    }
    if (normalized.includes("velocidade") || normalized.includes("speed")) {
        return "speed";
    }
    if (normalized.includes("sabedoria") || normalized.includes("wisdom")) {
        return "wisdom";
    }
    if (normalized.includes("energia") || normalized.includes("energy")) {
        return "energy";
    }
    if (normalized.includes("mugic")) {
        return "mugic";
    }

    return "none";
}

function normalizeStats(value: unknown, description: string): LocationStat[] {
    const validStats = new Set<string>(LOCATION_STATS);

    const stats = parseJsonArray(value)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter((item): item is LocationStat => validStats.has(item));

    if (stats.length > 0) {
        return stats;
    }

    return [inferStatFromDescription(description)];
}

function normalizeEffectType(value: unknown): LocationEffectType {
    if (typeof value !== "string") {
        return "special";
    }

    const normalized = value.trim().toLowerCase();

    if (LOCATION_EFFECT_TYPES.includes(normalized as LocationEffectType)) {
        return normalized as LocationEffectType;
    }

    if (["damage", "outperform", "protection", "forced_movement", "relocate_opponent", "deck_manipulation"].includes(normalized)) {
        return "special";
    }

    return "special";
}

function normalizeValue(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.floor(parsed);
}

function normalizeAbilities(value: unknown): CreateBattleGearRequestDto["abilities"] {
    const rawAbilities = parseJsonArray(value) as SeedAbility[];

    return rawAbilities
        .map((ability) => {
            const description = typeof ability.description === "string" ? ability.description.trim() : "";

            if (!description) {
                return null;
            }

            return {
                description,
                effectType: normalizeEffectType(ability.effect_type ?? ability.effectType),
                stats: normalizeStats(ability.stats ?? (ability.stat !== undefined ? [ability.stat] : []), description),
                cardTypes: normalizeCardTypes(ability.card_types ?? ability.cardTypes ?? []),
                value: normalizeValue(ability.value),
            } satisfies CreateBattleGearRequestDto["abilities"][number];
        })
        .filter((ability): ability is CreateBattleGearRequestDto["abilities"][number] => Boolean(ability));
}

function normalizePayload(item: SeedBattleGear): CreateBattleGearRequestDto | null {
    const name = typeof item.name === "string" ? item.name.trim() : "";

    if (!name) {
        return null;
    }

    return {
        name,
        rarity: normalizeRarity(item.rarity),
        imageFileId: null,
        allowedTribes: normalizeTribes(item.allowed_tribes ?? item.allowedTribes),
        allowedCreatureIds: parseJsonArray(item.allowed_creature_ids ?? item.allowedCreatureIds)
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        abilities: normalizeAbilities(item.abilities),
    };
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
            message: "Acesso negado. Apenas admin pode importar equipamentos.",
        };
    }

    return { ok: true as const };
}

export async function POST() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ImportBattlegearResponseDto = {
                success: false,
                imported: 0,
                updated: 0,
                skipped: 0,
                fileName: FILE_NAME,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const existing = await listBattleGear();
        const existingByName = new Map(
            existing.map((item) => [item.name.trim().toLowerCase(), item]),
        );

        let imported = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of battlegearSeed as SeedBattleGear[]) {
            const payload = normalizePayload(item);

            if (!payload || payload.abilities.length === 0) {
                skipped += 1;
                continue;
            }

            const key = payload.name.toLowerCase();
            const existingItem = existingByName.get(key);

            if (existingItem) {
                await updateBattleGearById(existingItem.id, payload);
                updated += 1;
                continue;
            }

            const created = await createBattleGear(payload);
            existingByName.set(key, created);
            imported += 1;
        }

        const response: ImportBattlegearResponseDto = {
            success: true,
            imported,
            updated,
            skipped,
            fileName: FILE_NAME,
            message: `${FILE_NAME} importado com sucesso.`,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportBattlegearResponseDto = {
            success: false,
            imported: 0,
            updated: 0,
            skipped: 0,
            fileName: FILE_NAME,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao importar equipamentos.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
