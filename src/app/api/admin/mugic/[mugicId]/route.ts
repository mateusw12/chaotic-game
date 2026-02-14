import { NextResponse } from "next/server";
import {
    type DeleteMugicResponseDto,
    type MugicAbilityDto,
    type UpdateMugicRequestDto,
    type UpdateMugicResponseDto,
} from "@/dto/mugic";
import type { CardRarity } from "@/dto/creature";
import type { LocationStat } from "@/dto/location";
import { auth } from "@/lib/auth";
import { deleteMugicById, getUserByEmail, updateMugicById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        mugicId: string;
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
            message: "Acesso negado. Apenas admin pode gerenciar mugics.",
        };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateMugicResponseDto = {
                success: false,
                mugic: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { mugicId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateMugicRequestDto>));

        const rawAbilities: Array<Partial<MugicAbilityDto> & { stat?: LocationStat }> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const mugic = await updateMugicById(mugicId, {
            name: body.name ?? "",
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            tribes: Array.isArray(body.tribes) ? body.tribes : [],
            cost: Number(body.cost ?? 0),
            abilities: rawAbilities.map((ability) => {
                const legacyStat = (ability as { stat?: LocationStat }).stat;

                return {
                    abilityType: (ability.abilityType ?? "stat_modifier") as UpdateMugicRequestDto["abilities"][number]["abilityType"],
                    description: String(ability.description ?? ""),
                    effectType: ability.effectType as UpdateMugicRequestDto["abilities"][number]["effectType"],
                    stats: Array.isArray(ability.stats)
                        ? (ability.stats as LocationStat[])
                        : legacyStat
                            ? [legacyStat]
                            : [],
                    cardTypes: Array.isArray(ability.cardTypes)
                        ? (ability.cardTypes as UpdateMugicRequestDto["abilities"][number]["cardTypes"])
                        : [],
                    targetScope: ability.targetScope as UpdateMugicRequestDto["abilities"][number]["targetScope"],
                    value: Number(ability.value ?? 0),
                    actionType: ability.actionType as UpdateMugicRequestDto["abilities"][number]["actionType"],
                };
            }),
        });

        const response: UpdateMugicResponseDto = {
            success: true,
            mugic,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateMugicResponseDto = {
            success: false,
            mugic: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao editar mugic.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteMugicResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { mugicId } = await context.params;
        await deleteMugicById(mugicId);

        const response: DeleteMugicResponseDto = {
            success: true,
            message: "Mugic removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteMugicResponseDto = {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao remover mugic.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
