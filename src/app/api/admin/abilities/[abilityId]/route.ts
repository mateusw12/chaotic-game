import { NextResponse } from "next/server";
import {
    type DeleteAbilityResponseDto,
    type UpdateAbilityRequestDto,
    type UpdateAbilityResponseDto,
} from "@/dto/ability";
import { auth } from "@/lib/auth";
import { deleteAbilityById, getUserByEmail, updateAbilityById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        abilityId: string;
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
            message: "Acesso negado. Apenas admin pode gerenciar habilidades.",
        };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateAbilityResponseDto = {
                success: false,
                ability: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { abilityId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateAbilityRequestDto>));

        const ability = await updateAbilityById(abilityId, {
            name: body.name ?? "",
            category: (body.category ?? "") as UpdateAbilityRequestDto["category"],
            effectType: (body.effectType ?? "") as UpdateAbilityRequestDto["effectType"],
            targetScope: (body.targetScope ?? "") as UpdateAbilityRequestDto["targetScope"],
            stat: (body.stat ?? "") as UpdateAbilityRequestDto["stat"],
            value: Number(body.value ?? 0),
            description: body.description ?? null,
        });

        const response: UpdateAbilityResponseDto = {
            success: true,
            ability,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateAbilityResponseDto = {
            success: false,
            ability: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao editar habilidade.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteAbilityResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { abilityId } = await context.params;
        await deleteAbilityById(abilityId);

        const response: DeleteAbilityResponseDto = {
            success: true,
            message: "Habilidade removida com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteAbilityResponseDto = {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao remover habilidade.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
