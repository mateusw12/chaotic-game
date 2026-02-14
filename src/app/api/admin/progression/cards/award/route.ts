import { NextResponse } from "next/server";
import type { RegisterCardAwardRequestDto, ProgressionMutationResponseDto } from "@/dto/progression";
import { auth } from "@/lib/auth";
import { getUserByEmail, registerCardAward } from "@/lib/supabase";

type AdminAwardCardRequest = RegisterCardAwardRequestDto & {
    userId?: string;
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
            message: "Acesso negado. Apenas admin pode conceder cartas.",
        };
    }

    return { ok: true as const };
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ProgressionMutationResponseDto = {
                success: false,
                progression: null,
                wallet: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<AdminAwardCardRequest>));

        if (!body.userId) {
            const response: ProgressionMutationResponseDto = {
                success: false,
                progression: null,
                wallet: null,
                message: "Informe o userId de destino para conceder carta.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const result = await registerCardAward({
            userId: body.userId,
            cardType: body.cardType as RegisterCardAwardRequestDto["cardType"],
            cardId: String(body.cardId ?? ""),
            rarity: body.rarity as RegisterCardAwardRequestDto["rarity"],
            quantity: body.quantity,
            referenceId: body.referenceId,
        });

        const response: ProgressionMutationResponseDto = {
            success: true,
            progression: result.progression,
            wallet: result.wallet,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ProgressionMutationResponseDto = {
            success: false,
            progression: null,
            wallet: null,
            message: error instanceof Error ? error.message : "Erro ao conceder carta.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}