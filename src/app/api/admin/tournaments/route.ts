import { NextResponse } from "next/server";
import {
    type CreateTournamentRequestDto,
    type CreateTournamentResponseDto,
    type ListTournamentsResponseDto,
} from "@/dto/tournament";
import { auth } from "@/lib/auth";
import { createTournament, getUserByEmail, listTournaments } from "@/lib/supabase";

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
            message: "Acesso negado. Apenas admin pode gerenciar torneios.",
        };
    }

    return { ok: true as const };
}

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListTournamentsResponseDto = {
                success: false,
                tournaments: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const tournaments = await listTournaments();

        const response: ListTournamentsResponseDto = {
            success: true,
            tournaments,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListTournamentsResponseDto = {
            success: false,
            tournaments: [],
            message: error instanceof Error ? error.message : "Erro ao listar torneios.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateTournamentResponseDto = {
                success: false,
                tournament: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateTournamentRequestDto>));

        const tournament = await createTournament({
            name: body.name ?? "",
            coverImageFileId: body.coverImageFileId ?? null,
            cardsCount: Number(body.cardsCount ?? 0),
            playersCount: Number(body.playersCount ?? 0),
            allowedFormats: Array.isArray(body.allowedFormats) ? body.allowedFormats : [],
            deckArchetypes: Array.isArray(body.deckArchetypes) ? body.deckArchetypes : [],
            maxCardEnergy: body.maxCardEnergy === null || body.maxCardEnergy === undefined ? null : Number(body.maxCardEnergy),
            allowedTribes: Array.isArray(body.allowedTribes) ? body.allowedTribes : [],
            allowMugic: Boolean(body.allowMugic),
            locationMode: (body.locationMode ?? "random") as CreateTournamentRequestDto["locationMode"],
            definedLocations: Array.isArray(body.definedLocations) ? body.definedLocations : [],
            additionalRules: body.additionalRules ?? null,
            scheduleType: (body.scheduleType ?? "date_range") as CreateTournamentRequestDto["scheduleType"],
            startAt: body.startAt ?? null,
            endAt: body.endAt ?? null,
            periodDays: body.periodDays === null || body.periodDays === undefined ? null : Number(body.periodDays),
            isEnabled: body.isEnabled !== false,
        });

        const response: CreateTournamentResponseDto = {
            success: true,
            tournament,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateTournamentResponseDto = {
            success: false,
            tournament: null,
            message: error instanceof Error ? error.message : "Erro ao cadastrar torneio.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
