import { NextResponse } from "next/server";
import type { AbilityCategory, AbilityEffectType, AbilityStat, AbilityTargetScope } from "@/dto/ability";
import abilitiesSeed from "@/components/data/abilities.json";
import { auth } from "@/lib/auth";
import {
    createAbility,
    getUserByEmail,
    listAbilities,
    updateAbilityById,
} from "@/lib/supabase";

type ImportAbilitiesResponseDto = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

type SeedAbility = {
    name?: unknown;
    category?: unknown;
    effect_type?: unknown;
    effectType?: unknown;
    target_scope?: unknown;
    targetScope?: unknown;
    stat?: unknown;
    value?: unknown;
    description?: unknown;
};

const FILE_NAME = "abilities.json";

function normalizeCategory(value: unknown): AbilityCategory {
    if (value === "support" || value === "brainwashed") {
        return value;
    }

    return "support";
}

function getRawEffectType(item: SeedAbility): unknown {
    if (item.effect_type !== undefined) {
        return item.effect_type;
    }

    return item.effectType;
}

function getRawTargetScope(item: SeedAbility): unknown {
    if (item.target_scope !== undefined) {
        return item.target_scope;
    }

    return item.targetScope;
}

function normalizeEffectType(value: unknown): AbilityEffectType {
    return value === "decrease" ? "decrease" : "increase";
}

function normalizeTargetScope(value: unknown): AbilityTargetScope {
    if (value === "same_tribe" || value === "enemy_only" || value === "all_creatures") {
        return value;
    }

    return "all_creatures";
}

function normalizeStat(value: unknown): AbilityStat {
    if (value === "power" || value === "courage" || value === "speed" || value === "wisdom" || value === "energy") {
        return value;
    }

    return "energy";
}

function normalizeValue(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.floor(parsed);
}

function normalizeDescription(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
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
            message: "Acesso negado. Apenas admin pode importar habilidades.",
        };
    }

    return { ok: true as const };
}

export async function POST() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ImportAbilitiesResponseDto = {
                success: false,
                imported: 0,
                updated: 0,
                skipped: 0,
                fileName: FILE_NAME,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const existing = await listAbilities();
        const existingByName = new Map(
            existing.map((ability) => [ability.name.trim().toLowerCase(), ability]),
        );

        let imported = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of abilitiesSeed as SeedAbility[]) {
            const name = typeof item.name === "string" ? item.name.trim() : "";

            if (!name) {
                skipped += 1;
                continue;
            }

            const normalizedName = name.toLowerCase();

            const payload = {
                name,
                category: normalizeCategory(item.category),
                effectType: normalizeEffectType(getRawEffectType(item)),
                targetScope: normalizeTargetScope(getRawTargetScope(item)),
                stat: normalizeStat(item.stat),
                value: normalizeValue(item.value),
                description: normalizeDescription(item.description),
            };

            const existingAbility = existingByName.get(normalizedName);

            if (existingAbility) {
                await updateAbilityById(existingAbility.id, payload);
                updated += 1;
                continue;
            }

            const created = await createAbility(payload);

            existingByName.set(normalizedName, created);
            imported += 1;
        }

        const response: ImportAbilitiesResponseDto = {
            success: true,
            imported,
            updated,
            skipped,
            fileName: FILE_NAME,
            message: `${FILE_NAME} importado com sucesso.`,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportAbilitiesResponseDto = {
            success: false,
            imported: 0,
            updated: 0,
            skipped: 0,
            fileName: FILE_NAME,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao importar habilidades.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
