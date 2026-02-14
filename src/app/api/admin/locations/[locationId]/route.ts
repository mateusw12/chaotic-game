import { NextResponse } from "next/server";
import {
    type DeleteLocationResponseDto,
    type LocationAbilityDto,
    type LocationStat,
    type UpdateLocationRequestDto,
    type UpdateLocationResponseDto,
} from "@/dto/location";
import type { CardRarity } from "@/dto/creature";
import { auth } from "@/lib/auth";
import { deleteLocationById, getUserByEmail, updateLocationById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        locationId: string;
    }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateLocationResponseDto = {
                success: false,
                location: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { locationId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateLocationRequestDto>));

        const rawAbilities: Array<Partial<LocationAbilityDto> & { stat?: LocationStat }> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const location = await updateLocationById(locationId, {
            name: body.name ?? "",
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
                effectType: ability.effectType as UpdateLocationRequestDto["abilities"][number]["effectType"],
                stats: Array.isArray(ability.stats)
                    ? (ability.stats as UpdateLocationRequestDto["abilities"][number]["stats"])
                    : ability.stat
                        ? [ability.stat as UpdateLocationRequestDto["abilities"][number]["stats"][number]]
                        : [],
                cardTypes: Array.isArray(ability.cardTypes)
                    ? (ability.cardTypes as UpdateLocationRequestDto["abilities"][number]["cardTypes"])
                    : [],
                value: Number(ability.value ?? 0),
            })),
        });

        const response: UpdateLocationResponseDto = {
            success: true,
            location,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateLocationResponseDto = {
            success: false,
            location: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao editar local.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteLocationResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { locationId } = await context.params;
        await deleteLocationById(locationId);

        const response: DeleteLocationResponseDto = {
            success: true,
            message: "Local removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteLocationResponseDto = {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao remover local.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
