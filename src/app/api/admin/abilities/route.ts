import { NextResponse } from "next/server";
import {
    type AbilityBattleRuleDto,
    isValidAbilityBattleRuleType,
    type CreateAbilityRequestDto,
    type CreateAbilityResponseDto,
    type ListAbilitiesResponseDto,
} from "@/dto/ability";
import { auth } from "@/lib/auth";
import { createAbility, getUserByEmail, listAbilities } from "@/lib/supabase";
import {
    isValidAbilityCategory,
    isValidAbilityEffectType,
    isValidAbilityStat,
    isValidAbilityTargetScope,
} from "@/lib/supabase/core";

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

function normalizeBattleRules(value: unknown): AbilityBattleRuleDto | null {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed as AbilityBattleRuleDto;
            }
        } catch {
            return null;
        }

        return null;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
        return value as AbilityBattleRuleDto;
    }

    return null;
}

function buildCreatePayload(body: Partial<CreateAbilityRequestDto>): CreateAbilityRequestDto {
    const name = String(body.name ?? "").trim();
    if (!name) {
        throw new Error("Nome da habilidade é obrigatório.");
    }

    if (!isValidAbilityCategory(String(body.category ?? ""))) {
        throw new Error("Categoria de habilidade inválida.");
    }

    if (!isValidAbilityEffectType(String(body.effectType ?? ""))) {
        throw new Error("Tipo de efeito inválido.");
    }

    if (!isValidAbilityTargetScope(String(body.targetScope ?? ""))) {
        throw new Error("Escopo de alvo inválido.");
    }

    if (!isValidAbilityStat(String(body.stat ?? ""))) {
        throw new Error("Atributo de habilidade inválido.");
    }

    const value = Number(body.value ?? 0);
    if (!Number.isFinite(value) || value < 0) {
        throw new Error("Valor da habilidade inválido.");
    }

    const battleRules = normalizeBattleRules(body.battleRules);
    if (battleRules && !isValidAbilityBattleRuleType(String(battleRules.type ?? ""))) {
        throw new Error("Tipo de battle_rules inválido.");
    }

    return {
        name,
        category: body.category,
        effectType: body.effectType,
        targetScope: body.targetScope,
        stat: body.stat,
        value,
        description: body.description ?? null,
        battleRules,
    };
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

        const ability = await createAbility(buildCreatePayload(body));

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
