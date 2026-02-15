import { NextResponse } from "next/server";
import type {
    DeckMutationResponseDto,
    DeleteDeckResponseDto,
    UpdateDeckRequestDto,
} from "@/dto/deck";
import { auth } from "@/lib/auth";
import { deleteUserDeck, getUserByEmail, updateUserDeck } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        deckId: string;
    }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: DeckMutationResponseDto = {
            success: false,
            deck: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json().catch(() => ({} as Partial<UpdateDeckRequestDto>));

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: DeckMutationResponseDto = {
                success: false,
                deck: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const { deckId } = await context.params;

        const deck = await updateUserDeck(user.id, deckId, {
            name: body.name,
            cards: Array.isArray(body.cards)
                ? body.cards.map((item: { cardType: string; cardId: string; quantity: number }) => ({
                    cardType: item.cardType,
                    cardId: item.cardId,
                    quantity: Number(item.quantity ?? 0),
                }))
                : undefined,
        });

        const response: DeckMutationResponseDto = {
            success: true,
            deck,
            message: "Deck atualizado com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeckMutationResponseDto = {
            success: false,
            deck: null,
            message: error instanceof Error ? error.message : "Erro ao atualizar deck.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: DeleteDeckResponseDto = {
            success: false,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: DeleteDeckResponseDto = {
                success: false,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const { deckId } = await context.params;
        await deleteUserDeck(user.id, deckId);

        const response: DeleteDeckResponseDto = {
            success: true,
            message: "Deck removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteDeckResponseDto = {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao remover deck.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
