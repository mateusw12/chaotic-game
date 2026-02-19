import { NextResponse } from "next/server";
import {
    type AttackAbilityDto,
    type AttackElementValueDto,
    type CreateAttackRequestDto,
    type CreateAttackResponseDto,
    type ListAttacksResponseDto,
} from "@/dto/attack";
import type { CardRarity, CreatureElement } from "@/dto/creature";
import { auth } from "@/lib/auth";
import { createAttack, getUserByEmail, listAttacks } from "@/lib/supabase";

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

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListAttacksResponseDto = {
                success: false,
                attacks: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const attacks = await listAttacks();

        const response: ListAttacksResponseDto = {
            success: true,
            attacks,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListAttacksResponseDto = {
            success: false,
            attacks: [],
            message: error instanceof Error ? error.message : "Erro ao listar ataques.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateAttackResponseDto = {
                success: false,
                attack: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request.json().catch(() => ({} as Partial<CreateAttackRequestDto>));

        const rawElementValues: Array<Partial<AttackElementValueDto>> = Array.isArray(body.elementValues)
            ? body.elementValues
            : [];

        const rawAbilities: Array<Partial<AttackAbilityDto>> = Array.isArray(body.abilities)
            ? body.abilities
            : [];

        const attack = await createAttack({
            name: body.name ?? "",
            fileName: body.fileName ?? null,
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
                targetScope: ability.targetScope as CreateAttackRequestDto["abilities"][number]["targetScope"],
                effectType: ability.effectType as CreateAttackRequestDto["abilities"][number]["effectType"],
                stat: ability.stat as CreateAttackRequestDto["abilities"][number]["stat"],
                value: Number(ability.value ?? 0),
            })),
        });

        const response: CreateAttackResponseDto = {
            success: true,
            attack,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateAttackResponseDto = {
            success: false,
            attack: null,
            message: error instanceof Error ? error.message : "Erro ao cadastrar ataque.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
