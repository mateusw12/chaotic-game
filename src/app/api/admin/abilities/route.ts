import { NextResponse } from "next/server";
import {
    type CreateAbilityRequestDto,
    type CreateAbilityResponseDto,
    type ListAbilitiesResponseDto,
} from "@/dto/ability";
import { auth } from "@/lib/auth";
import { createAbility, getUserByEmail, listAbilities } from "@/lib/supabase";

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
            message: "Acesso negado. Apenas admin pode cadastrar habilidades.",
        };
    }

    return { ok: true as const };
}

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListAbilitiesResponseDto = {
                success: false,
                abilities: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const abilities = await listAbilities();

        const response: ListAbilitiesResponseDto = {
            success: true,
            abilities,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListAbilitiesResponseDto = {
            success: false,
            abilities: [],
            message:
                error instanceof Error ? error.message : "Erro ao listar habilidades.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateAbilityResponseDto = {
                success: false,
                ability: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateAbilityRequestDto>));

        const ability = await createAbility({
            name: body.name ?? "",
            category: (body.category ?? "") as CreateAbilityRequestDto["category"],
            effectType: (body.effectType ?? "") as CreateAbilityRequestDto["effectType"],
            targetScope: (body.targetScope ?? "") as CreateAbilityRequestDto["targetScope"],
            stat: (body.stat ?? "") as CreateAbilityRequestDto["stat"],
            value: Number(body.value ?? 0),
            description: body.description ?? null,
        });

        const response: CreateAbilityResponseDto = {
            success: true,
            ability,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateAbilityResponseDto = {
            success: false,
            ability: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao cadastrar habilidade.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
