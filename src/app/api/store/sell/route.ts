import { NextResponse } from "next/server";
import type { SellStoreCardsRequestDto, SellStoreCardsResponseDto } from "@/dto/store";
import { auth } from "@/lib/auth";
import { getUserByEmail, sellStoreCards } from "@/lib/supabase";

export async function POST(request: Request) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: SellStoreCardsResponseDto = {
            success: false,
            soldCount: 0,
            coinsEarned: 0,
            progression: null,
            wallet: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: SellStoreCardsResponseDto = {
                success: false,
                soldCount: 0,
                coinsEarned: 0,
                progression: null,
                wallet: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<SellStoreCardsRequestDto>));

        if (!Array.isArray(body.cards) || body.cards.length === 0) {
            const response: SellStoreCardsResponseDto = {
                success: false,
                soldCount: 0,
                coinsEarned: 0,
                progression: null,
                wallet: null,
                message: "Informe ao menos uma carta para vender.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const result = await sellStoreCards(user.id, body.cards);

        const response: SellStoreCardsResponseDto = {
            success: true,
            soldCount: result.soldCount,
            coinsEarned: result.coinsEarned,
            progression: result.progression,
            wallet: result.wallet,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: SellStoreCardsResponseDto = {
            success: false,
            soldCount: 0,
            coinsEarned: 0,
            progression: null,
            wallet: null,
            message: error instanceof Error ? error.message : "Erro ao vender cartas.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
