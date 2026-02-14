import { NextResponse } from "next/server";
import type {
    ChooseStarterTribeRequestDto,
    ChooseStarterTribeResponseDto,
    GetStarterProgressionStatusResponseDto,
} from "@/dto/progression";
import { isValidStarterSelectableTribe } from "@/dto/progression";
import { auth } from "@/lib/auth";
import {
    chooseStarterTribeAndGrantRewards,
    getStarterProgressionStatus,
    getUserByEmail,
} from "@/lib/supabase";

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: GetStarterProgressionStatusResponseDto = {
            success: false,
            requiresChoice: false,
            selectedTribe: null,
            allowedTribes: [],
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: GetStarterProgressionStatusResponseDto = {
                success: false,
                requiresChoice: false,
                selectedTribe: null,
                allowedTribes: [],
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const status = await getStarterProgressionStatus(user.id);

        const response: GetStarterProgressionStatusResponseDto = {
            success: true,
            requiresChoice: status.requiresChoice,
            selectedTribe: status.selectedTribe,
            allowedTribes: status.allowedTribes,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: GetStarterProgressionStatusResponseDto = {
            success: false,
            requiresChoice: false,
            selectedTribe: null,
            allowedTribes: [],
            message: error instanceof Error ? error.message : "Erro ao consultar status inicial.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: ChooseStarterTribeResponseDto = {
            success: false,
            selectedTribe: null,
            packs: [],
            progression: null,
            wallet: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            const response: ChooseStarterTribeResponseDto = {
                success: false,
                selectedTribe: null,
                packs: [],
                progression: null,
                wallet: null,
                message: "Usuário não encontrado.",
            };

            return NextResponse.json(response, { status: 404 });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<ChooseStarterTribeRequestDto>));

        if (!body.tribe || !isValidStarterSelectableTribe(body.tribe)) {
            const response: ChooseStarterTribeResponseDto = {
                success: false,
                selectedTribe: null,
                packs: [],
                progression: null,
                wallet: null,
                message: "Tribo inválida para escolha inicial.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const result = await chooseStarterTribeAndGrantRewards(user.id, body.tribe);

        const response: ChooseStarterTribeResponseDto = {
            success: true,
            selectedTribe: result.selectedTribe,
            packs: result.packs,
            progression: result.progression,
            wallet: result.wallet,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ChooseStarterTribeResponseDto = {
            success: false,
            selectedTribe: null,
            packs: [],
            progression: null,
            wallet: null,
            message: error instanceof Error ? error.message : "Erro ao selecionar tribo inicial.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
