import { NextResponse } from "next/server";
import type { GetStorePacksResponseDto } from "@/dto/store";
import { auth } from "@/lib/auth";
import { getUserByEmail, listStorePacksForUser } from "@/lib/supabase";

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: GetStorePacksResponseDto = {
            success: false,
            packs: [],
            wallet: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: GetStorePacksResponseDto = {
                success: false,
                packs: [],
                wallet: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const result = await listStorePacksForUser(user.id);

        const response: GetStorePacksResponseDto = {
            success: true,
            packs: result.packs,
            wallet: result.wallet,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: GetStorePacksResponseDto = {
            success: false,
            packs: [],
            wallet: null,
            message: error instanceof Error ? error.message : "Erro ao carregar pacotes da loja.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
