import { NextResponse } from "next/server";
import {
    type ProgressionMutationResponseDto,
    type RegisterBattleVictoryRequestDto,
} from "@/dto/progression";
import { auth } from "@/lib/auth";
import { getUserByEmail, registerBattleVictory } from "@/lib/supabase";

export async function POST(request: Request) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: ProgressionMutationResponseDto = {
            success: false,
            progression: null,
            wallet: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: ProgressionMutationResponseDto = {
                success: false,
                progression: null,
                wallet: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<RegisterBattleVictoryRequestDto>));

        const result = await registerBattleVictory(user.id, body.referenceId ?? null);

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
            message: error instanceof Error ? error.message : "Erro ao registrar vitória.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}