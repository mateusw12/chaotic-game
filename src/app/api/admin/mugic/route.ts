import { NextResponse } from "next/server";
import {
    type CreateMugicRequestDto,
    type CreateMugicResponseDto,
    type ListMugicResponseDto,
    type MugicAbilityDto,
} from "@/dto/mugic";
import type { CardRarity } from "@/dto/creature";
import type { LocationStat } from "@/dto/location";
import { auth } from "@/lib/auth";
import { createMugic, getUserByEmail, listMugics } from "@/lib/supabase";

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

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListMugicResponseDto = {
                success: false,
                mugics: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const mugics = await listMugics();

        const response: ListMugicResponseDto = {
            success: true,
            mugics,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListMugicResponseDto = {
            success: false,
            mugics: [],
            message:
                error instanceof Error ? error.message : "Erro ao listar mugics.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateMugicResponseDto = {
                success: false,
                mugic: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateMugicRequestDto>));

        const rawAbilities: Array<Partial<MugicAbilityDto> & { stat?: LocationStat }> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const mugic = await createMugic({
            name: body.name ?? "",
            rarity: (body.rarity ?? "comum") as CardRarity,
            imageFileId: body.imageFileId ?? null,
            tribes: Array.isArray(body.tribes) ? body.tribes : [],
            cost: Number(body.cost ?? 0),
            abilities: rawAbilities.map((ability) => {
                const legacyStat = (ability as { stat?: LocationStat }).stat;

                return {
                    abilityType: (ability.abilityType ?? "stat_modifier") as CreateMugicRequestDto["abilities"][number]["abilityType"],
                    description: String(ability.description ?? ""),
                    effectType: ability.effectType as CreateMugicRequestDto["abilities"][number]["effectType"],
                    stats: Array.isArray(ability.stats)
                        ? (ability.stats as LocationStat[])
                        : legacyStat
                            ? [legacyStat]
                            : [],
                    cardTypes: Array.isArray(ability.cardTypes)
                        ? (ability.cardTypes as CreateMugicRequestDto["abilities"][number]["cardTypes"])
                        : [],
                    targetScope: ability.targetScope as CreateMugicRequestDto["abilities"][number]["targetScope"],
                    targetTribes: Array.isArray(ability.targetTribes)
                        ? (ability.targetTribes as CreateMugicRequestDto["abilities"][number]["targetTribes"])
                        : [],
                    value: Number(ability.value ?? 0),
                    actionType: ability.actionType as CreateMugicRequestDto["abilities"][number]["actionType"],
                    actionPayload:
                        ability.actionPayload && typeof ability.actionPayload === "object" && !Array.isArray(ability.actionPayload)
                            ? (ability.actionPayload as Record<string, unknown>)
                            : null,
                };
            }),
        });

        const response: CreateMugicResponseDto = {
            success: true,
            mugic,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateMugicResponseDto = {
            success: false,
            mugic: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao cadastrar mugic.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
