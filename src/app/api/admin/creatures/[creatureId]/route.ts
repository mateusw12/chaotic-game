import { NextResponse } from "next/server";
import {
    type CardRarity,
    type DeleteCreatureResponseDto,
    type UpdateCreatureRequestDto,
    type UpdateCreatureResponseDto,
} from "@/dto/creature";
import { auth } from "@/lib/auth";
import { deleteCreatureById, getUserByEmail, updateCreatureById } from "@/lib/supabase";

function parseAbilityIds(value: unknown): string[] {
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

type RouteContext = {
    params: Promise<{
        creatureId: string;
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
            message: "Acesso negado. Apenas admin pode gerenciar criaturas.",
        };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateCreatureResponseDto = {
                success: false,
                creature: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { creatureId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateCreatureRequestDto>));

        const creature = await updateCreatureById(creatureId, {
            name: body.name ?? "",
            fileName: body.fileName ?? null,
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            tribe: (body.tribe ?? "") as UpdateCreatureRequestDto["tribe"],
            power: Number(body.power ?? 0),
            courage: Number(body.courage ?? 0),
            speed: Number(body.speed ?? 0),
            wisdom: Number(body.wisdom ?? 0),
            mugic: Number(body.mugic ?? 0),
            energy: Number(body.energy ?? 0),
            dominantElements: Array.isArray(body.dominantElements)
                ? body.dominantElements
                : [],
            supportAbilityId: parseAbilityIds(body.supportAbilityId),
            brainwashedAbilityId: parseAbilityIds(body.brainwashedAbilityId),
            equipmentNote: body.equipmentNote ?? null,
        });

        const response: UpdateCreatureResponseDto = {
            success: true,
            creature,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateCreatureResponseDto = {
            success: false,
            creature: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao editar criatura.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteCreatureResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { creatureId } = await context.params;
        await deleteCreatureById(creatureId);

        const response: DeleteCreatureResponseDto = {
            success: true,
            message: "Criatura removida com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteCreatureResponseDto = {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao remover criatura.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
