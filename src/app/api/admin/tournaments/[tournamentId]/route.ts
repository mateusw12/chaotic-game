import { NextResponse } from "next/server";
import {
    type DeleteTournamentResponseDto,
    type UpdateTournamentRequestDto,
    type UpdateTournamentResponseDto,
} from "@/dto/tournament";
import { auth } from "@/lib/auth";
import { deleteTournamentById, getUserByEmail, updateTournamentById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        tournamentId: string;
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
            message: "Acesso negado. Apenas admin pode gerenciar torneios.",
        };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateTournamentResponseDto = {
                success: false,
                tournament: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { tournamentId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateTournamentRequestDto>));

        const tournament = await updateTournamentById(tournamentId, {
            name: body.name ?? "",
            coverImageFileId: body.coverImageFileId ?? null,
            cardsCount: Number(body.cardsCount ?? 0),
            playersCount: Number(body.playersCount ?? 0),
            allowedFormats: Array.isArray(body.allowedFormats) ? body.allowedFormats : [],
            deckArchetypes: Array.isArray(body.deckArchetypes) ? body.deckArchetypes : [],
            maxCardEnergy: body.maxCardEnergy === null || body.maxCardEnergy === undefined ? null : Number(body.maxCardEnergy),
            allowedTribes: Array.isArray(body.allowedTribes) ? body.allowedTribes : [],
            allowMugic: Boolean(body.allowMugic),
            locationMode: (body.locationMode ?? "random") as UpdateTournamentRequestDto["locationMode"],
            definedLocations: Array.isArray(body.definedLocations) ? body.definedLocations : [],
            additionalRules: body.additionalRules ?? null,
            scheduleType: (body.scheduleType ?? "date_range") as UpdateTournamentRequestDto["scheduleType"],
            startAt: body.startAt ?? null,
            endAt: body.endAt ?? null,
            periodDays: body.periodDays === null || body.periodDays === undefined ? null : Number(body.periodDays),
            isEnabled: body.isEnabled !== false,
        });

        const response: UpdateTournamentResponseDto = {
            success: true,
            tournament,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateTournamentResponseDto = {
            success: false,
            tournament: null,
            message: error instanceof Error ? error.message : "Erro ao editar torneio.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteTournamentResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { tournamentId } = await context.params;
        await deleteTournamentById(tournamentId);

        const response: DeleteTournamentResponseDto = {
            success: true,
            message: "Torneio removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteTournamentResponseDto = {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao remover torneio.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
