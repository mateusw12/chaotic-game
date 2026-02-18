import { NextResponse } from "next/server";
import {
    type CreateLocationRequestDto,
    type CreateLocationResponseDto,
    type ListLocationsResponseDto,
    type LocationAbilityDto,
    type LocationStat,
} from "@/dto/location";
import type { CardRarity } from "@/dto/creature";
import { auth } from "@/lib/auth";
import { createLocation, getUserByEmail, listLocations } from "@/lib/supabase";

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
            message: "Acesso negado. Apenas admin pode gerenciar locais.",
        };
    }

    return { ok: true as const };
}

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListLocationsResponseDto = {
                success: false,
                locations: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const locations = await listLocations();

        const response: ListLocationsResponseDto = {
            success: true,
            locations,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListLocationsResponseDto = {
            success: false,
            locations: [],
            message:
                error instanceof Error ? error.message : "Erro ao listar locais.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateLocationResponseDto = {
                success: false,
                location: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateLocationRequestDto>));

        const rawAbilities: Array<Partial<LocationAbilityDto> & { stat?: LocationStat }> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const location = await createLocation({
            name: body.name ?? "",
            fileName: body.fileName ?? null,
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            initiativeElements: Array.isArray(body.initiativeElements)
                ? body.initiativeElements
                : [],
            tribes: Array.isArray(body.tribes)
                ? body.tribes
                : [],
            abilities: rawAbilities.map((ability) => ({
                description: String(ability.description ?? ""),
                effectType: ability.effectType as CreateLocationRequestDto["abilities"][number]["effectType"],
                targetScope:
                    (ability.targetScope as CreateLocationRequestDto["abilities"][number]["targetScope"])
                    ?? "all_creatures",
                targetTribes: Array.isArray(ability.targetTribes)
                    ? (ability.targetTribes as CreateLocationRequestDto["abilities"][number]["targetTribes"])
                    : [],
                stats: Array.isArray(ability.stats)
                    ? (ability.stats as CreateLocationRequestDto["abilities"][number]["stats"])
                    : ability.stat
                        ? [ability.stat as CreateLocationRequestDto["abilities"][number]["stats"][number]]
                        : [],
                cardTypes: Array.isArray(ability.cardTypes)
                    ? (ability.cardTypes as CreateLocationRequestDto["abilities"][number]["cardTypes"])
                    : [],
                value: Number(ability.value ?? 0),
                battleRules:
                    (ability.battleRules as CreateLocationRequestDto["abilities"][number]["battleRules"])
                    ?? null,
            })),
        });

        const response: CreateLocationResponseDto = {
            success: true,
            location,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateLocationResponseDto = {
            success: false,
            location: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao cadastrar local.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
