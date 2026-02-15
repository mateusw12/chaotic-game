import { NextResponse } from "next/server";
import type { PurchaseStorePackRequestDto, PurchaseStorePackResponseDto } from "@/dto/store";
import { auth } from "@/lib/auth";
import { getUserByEmail, purchaseStorePack } from "@/lib/supabase";

export async function POST(request: Request) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: PurchaseStorePackResponseDto = {
            success: false,
            packId: null,
            cards: [],
            progression: null,
            wallet: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: PurchaseStorePackResponseDto = {
                success: false,
                packId: null,
                cards: [],
                progression: null,
                wallet: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<PurchaseStorePackRequestDto>));

        if (!body.packId) {
            const response: PurchaseStorePackResponseDto = {
                success: false,
                packId: null,
                cards: [],
                progression: null,
                wallet: null,
                message: "Informe o pacote que deseja comprar.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const result = await purchaseStorePack(user.id, body.packId, body.currency);

        const response: PurchaseStorePackResponseDto = {
            success: true,
            packId: result.packId,
            cards: result.cards,
            progression: result.progression,
            wallet: result.wallet,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: PurchaseStorePackResponseDto = {
            success: false,
            packId: null,
            cards: [],
            progression: null,
            wallet: null,
            message: error instanceof Error ? error.message : "Erro ao comprar pacote.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
