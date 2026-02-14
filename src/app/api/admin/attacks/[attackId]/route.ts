import { NextResponse } from "next/server";
import {
    type AttackAbilityDto,
    type AttackElementValueDto,
    type DeleteAttackResponseDto,
    type UpdateAttackRequestDto,
    type UpdateAttackResponseDto,
} from "@/dto/attack";
import type { CardRarity, CreatureElement } from "@/dto/creature";
import { auth } from "@/lib/auth";
import { deleteAttackById, getUserByEmail, updateAttackById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{ attackId: string }>;
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
            message: "Acesso negado. Apenas admin pode gerenciar ataques.",
        };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateAttackResponseDto = {
                success: false,
                attack: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { attackId } = await context.params;
        const body = await request.json().catch(() => ({} as Partial<UpdateAttackRequestDto>));

        const rawElementValues: Array<Partial<AttackElementValueDto>> = Array.isArray(body.elementValues)
            ? body.elementValues
            : [];

        const rawAbilities: Array<Partial<AttackAbilityDto>> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const attack = await updateAttackById(attackId, {
            name: body.name ?? "",
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            energyCost: Number(body.energyCost ?? 0),
            elementValues: rawElementValues.map((item) => ({
                element: item.element as CreatureElement,
                value: Number(item.value ?? 0),
            })),
            abilities: rawAbilities.map((ability) => ({
                description: String(ability.description ?? ""),
                conditionElement: ability.conditionElement as CreatureElement | undefined,
                targetScope: ability.targetScope as UpdateAttackRequestDto["abilities"][number]["targetScope"],
                effectType: ability.effectType as UpdateAttackRequestDto["abilities"][number]["effectType"],
                stat: ability.stat as UpdateAttackRequestDto["abilities"][number]["stat"],
                value: Number(ability.value ?? 0),
            })),
        });

        const response: UpdateAttackResponseDto = {
            success: true,
            attack,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateAttackResponseDto = {
            success: false,
            attack: null,
            message: error instanceof Error ? error.message : "Erro ao editar ataque.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteAttackResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { attackId } = await context.params;
        await deleteAttackById(attackId);

        const response: DeleteAttackResponseDto = {
            success: true,
            message: "Ataque removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteAttackResponseDto = {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao remover ataque.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
