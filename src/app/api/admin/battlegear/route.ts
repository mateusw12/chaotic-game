import { NextResponse } from "next/server";
import {
    type BattleGearAbilityDto,
    type CreateBattleGearRequestDto,
    type CreateBattleGearResponseDto,
    type ListBattleGearResponseDto,
    type BattleGearBattleRuleDto,
} from "@/dto/battlegear";
import type { CardRarity } from "@/dto/creature";
import type { LocationStat } from "@/dto/location";
import { auth } from "@/lib/auth";
import { createBattleGear, getUserByEmail, listBattleGear } from "@/lib/supabase";

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

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListBattleGearResponseDto = {
                success: false,
                battlegear: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const battlegear = await listBattleGear();

        const response: ListBattleGearResponseDto = {
            success: true,
            battlegear,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListBattleGearResponseDto = {
            success: false,
            battlegear: [],
            message:
                error instanceof Error ? error.message : "Erro ao listar equipamentos.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateBattleGearResponseDto = {
                success: false,
                battlegearItem: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateBattleGearRequestDto>));

        const rawAbilities: Array<Partial<BattleGearAbilityDto> & { stat?: LocationStat; battleRules?: BattleGearBattleRuleDto | null }> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const battlegearItem = await createBattleGear({
            name: body.name ?? "",
            fileName: typeof body.fileName === "string" ? body.fileName : body.fileName ?? undefined,
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            allowedTribes: Array.isArray(body.allowedTribes) ? body.allowedTribes : [],
            allowedCreatureIds: Array.isArray(body.allowedCreatureIds) ? body.allowedCreatureIds : [],
            abilities: rawAbilities.map((ability) => ({
                description: String(ability.description ?? ""),
                effectType: ability.effectType as CreateBattleGearRequestDto["abilities"][number]["effectType"],
                targetScope: (ability.targetScope ?? "all_creatures") as CreateBattleGearRequestDto["abilities"][number]["targetScope"],
                targetTribes: Array.isArray(ability.targetTribes)
                    ? (ability.targetTribes as CreateBattleGearRequestDto["abilities"][number]["targetTribes"])
                    : [],
                stats: Array.isArray(ability.stats)
                    ? (ability.stats as CreateBattleGearRequestDto["abilities"][number]["stats"])
                    : ability.stat
                        ? [ability.stat as CreateBattleGearRequestDto["abilities"][number]["stats"][number]]
                        : [],
                cardTypes: Array.isArray(ability.cardTypes)
                    ? (ability.cardTypes as CreateBattleGearRequestDto["abilities"][number]["cardTypes"])
                    : [],
                value: Number(ability.value ?? 0),
                battleRules:
                    ability.battleRules && typeof ability.battleRules === "object" && !Array.isArray(ability.battleRules)
                        ? {
                            type: ability.battleRules.type,
                            requiresTarget: ability.battleRules.requiresTarget,
                            usageLimitPerTurn: ability.battleRules.usageLimitPerTurn ?? null,
                            notes: ability.battleRules.notes ?? null,
                            payload:
                                ability.battleRules.payload
                                    && typeof ability.battleRules.payload === "object"
                                    && !Array.isArray(ability.battleRules.payload)
                                    ? ability.battleRules.payload
                                    : null,
                        }
                        : null,
            })),
        });

        const response: CreateBattleGearResponseDto = {
            success: true,
            battlegearItem,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateBattleGearResponseDto = {
            success: false,
            battlegearItem: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao cadastrar equipamento.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
