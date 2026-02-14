import { NextResponse } from "next/server";
import type { GetUserProgressionOverviewResponseDto } from "@/dto/progression";
import { auth } from "@/lib/auth";
import { getUserByEmail, getUserProgressionOverview } from "@/lib/supabase";

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: GetUserProgressionOverviewResponseDto = {
            success: false,
            overview: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: GetUserProgressionOverviewResponseDto = {
                success: false,
                overview: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const overview = await getUserProgressionOverview(user.id);

        const response: GetUserProgressionOverviewResponseDto = {
            success: true,
            overview,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: GetUserProgressionOverviewResponseDto = {
            success: false,
            overview: null,
            message: error instanceof Error ? error.message : "Erro ao carregar progressão.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}