import { NextResponse } from "next/server";
import {
    type BattleGearAbilityDto,
    type DeleteBattleGearResponseDto,
    type UpdateBattleGearRequestDto,
    type UpdateBattleGearResponseDto,
} from "@/dto/battlegear";
import type { CardRarity } from "@/dto/creature";
import type { LocationStat } from "@/dto/location";
import { auth } from "@/lib/auth";
import { deleteBattleGearById, getUserByEmail, updateBattleGearById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        battleGearId: string;
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
            message: "Acesso negado. Apenas admin pode gerenciar equipamentos.",
        };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateBattleGearResponseDto = {
                success: false,
                battlegearItem: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { battleGearId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateBattleGearRequestDto>));

        const rawAbilities: Array<Partial<BattleGearAbilityDto> & { stat?: LocationStat }> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const battlegearItem = await updateBattleGearById(battleGearId, {
            name: body.name ?? "",
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            allowedTribes: Array.isArray(body.allowedTribes) ? body.allowedTribes : [],
            allowedCreatureIds: Array.isArray(body.allowedCreatureIds) ? body.allowedCreatureIds : [],
            abilities: rawAbilities.map((ability) => ({
                description: String(ability.description ?? ""),
                effectType: ability.effectType as UpdateBattleGearRequestDto["abilities"][number]["effectType"],
                targetScope: (ability.targetScope ?? "all_creatures") as UpdateBattleGearRequestDto["abilities"][number]["targetScope"],
                targetTribes: Array.isArray(ability.targetTribes)
                    ? (ability.targetTribes as UpdateBattleGearRequestDto["abilities"][number]["targetTribes"])
                    : [],
                stats: Array.isArray(ability.stats)
                    ? (ability.stats as UpdateBattleGearRequestDto["abilities"][number]["stats"])
                    : ability.stat
                        ? [ability.stat as UpdateBattleGearRequestDto["abilities"][number]["stats"][number]]
                        : [],
                cardTypes: Array.isArray(ability.cardTypes)
                    ? (ability.cardTypes as UpdateBattleGearRequestDto["abilities"][number]["cardTypes"])
                    : [],
                value: Number(ability.value ?? 0),
            })),
        });

        const response: UpdateBattleGearResponseDto = {
            success: true,
            battlegearItem,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateBattleGearResponseDto = {
            success: false,
            battlegearItem: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao editar equipamento.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteBattleGearResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { battleGearId } = await context.params;
        await deleteBattleGearById(battleGearId);

        const response: DeleteBattleGearResponseDto = {
            success: true,
            message: "Equipamento removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteBattleGearResponseDto = {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao remover equipamento.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
