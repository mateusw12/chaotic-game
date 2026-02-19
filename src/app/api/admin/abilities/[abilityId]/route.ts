import { NextResponse } from "next/server";
import {
    type AbilityBattleRuleDto,
    isValidAbilityBattleRuleType,
    type DeleteAbilityResponseDto,
    type UpdateAbilityRequestDto,
    type UpdateAbilityResponseDto,
} from "@/dto/ability";
import { auth } from "@/lib/auth";
import { deleteAbilityById, getUserByEmail, updateAbilityById } from "@/lib/supabase";
import {
    isValidAbilityCategory,
    isValidAbilityEffectType,
    isValidAbilityStat,
    isValidAbilityTargetScope,
} from "@/lib/supabase/core";

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

function buildUpdatePayload(body: Partial<UpdateAbilityRequestDto>): UpdateAbilityRequestDto {
    const name = String(body.name ?? "").trim();
    if (!name) {
        throw new Error("Nome da habilidade é obrigatório.");
    }

    const category = String(body.category ?? "");
    if (!isValidAbilityCategory(category)) {
        throw new Error("Categoria de habilidade inválida.");
    }

    const effectType = String(body.effectType ?? "");
    if (!isValidAbilityEffectType(effectType)) {
        throw new Error("Tipo de efeito inválido.");
    }

    const targetScope = String(body.targetScope ?? "");
    if (!isValidAbilityTargetScope(targetScope)) {
        throw new Error("Escopo de alvo inválido.");
    }

    const stat = String(body.stat ?? "");
    if (!isValidAbilityStat(stat)) {
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
        category,
        effectType,
        targetScope,
        stat,
        value,
        description: body.description ?? null,
        battleRules,
    };
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

        const ability = await updateAbilityById(abilityId, buildUpdatePayload(body));

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
