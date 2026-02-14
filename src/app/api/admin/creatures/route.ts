import { NextResponse } from "next/server";
import {
    type CardRarity,
    type CreateCreatureRequestDto,
    type CreateCreatureResponseDto,
    type ListCreaturesResponseDto,
} from "@/dto/creature";
import { auth } from "@/lib/auth";
import { createCreature, getUserByEmail, listCreatures } from "@/lib/supabase";

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
            message: "Acesso negado. Apenas admin pode cadastrar criaturas.",
        };
    }

    return { ok: true as const };
}

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListCreaturesResponseDto = {
                success: false,
                creatures: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const creatures = await listCreatures();

        const response: ListCreaturesResponseDto = {
            success: true,
            creatures,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListCreaturesResponseDto = {
            success: false,
            creatures: [],
            message:
                error instanceof Error ? error.message : "Erro ao listar criaturas.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateCreatureResponseDto = {
                success: false,
                creature: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateCreatureRequestDto>));

        const creature = await createCreature({
            name: body.name ?? "",
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            tribe: (body.tribe ?? "") as CreateCreatureRequestDto["tribe"],
            power: Number(body.power ?? 0),
            courage: Number(body.courage ?? 0),
            speed: Number(body.speed ?? 0),
            wisdom: Number(body.wisdom ?? 0),
            mugic: Number(body.mugic ?? 0),
            energy: Number(body.energy ?? 0),
            dominantElements: Array.isArray(body.dominantElements)
                ? body.dominantElements
                : [],
            supportAbilityId: body.supportAbilityId ?? null,
            brainwashedAbilityId: body.brainwashedAbilityId ?? null,
            equipmentNote: body.equipmentNote ?? null,
        });

        const response: CreateCreatureResponseDto = {
            success: true,
            creature,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateCreatureResponseDto = {
            success: false,
            creature: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao cadastrar criatura.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
