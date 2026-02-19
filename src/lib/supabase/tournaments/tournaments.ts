import {
    type CreateTournamentRequestDto,
    type TournamentDto,
    type TournamentFormat,
    type TournamentLocationMode,
    type TournamentScheduleType,
    type UpdateTournamentRequestDto,
    isValidTournamentFormat,
    isValidTournamentLocationMode,
    isValidTournamentScheduleType,
    isValidTournamentTribe,
} from "@/dto/tournament";
import {
    getTournamentCoverImagePublicUrl,
    getSupabaseAdminClient,
} from "../storage";
import { getTournamentsTableName, isMissingTableError } from "../core";
import type { SupabaseApiError, SupabaseTournamentRow } from "../types";

function isIsoDate(value: string): boolean {
    return !Number.isNaN(Date.parse(value));
}

function sanitizeArrayString(values: unknown): string[] {
    if (!Array.isArray(values)) {
        return [];
    }

    return values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => Boolean(value));
}

function mapSupabaseTournamentRow(row: SupabaseTournamentRow, referenceDate?: Date): TournamentDto {
    const now = referenceDate ?? new Date();

    const startDate = row.start_at ? new Date(row.start_at) : null;
    const endDate = row.end_at ? new Date(row.end_at) : null;

    let isCurrentlyAvailable = false;

    if (row.is_enabled) {
        if (row.schedule_type === "date_range") {
            const afterStart = !startDate || now >= startDate;
            const beforeEnd = !endDate || now <= endDate;
            isCurrentlyAvailable = afterStart && beforeEnd;
        } else {
            const interval = row.period_days ?? 0;
            const baseDate = startDate ?? new Date(row.created_at);

            if (interval > 0 && now >= baseDate) {
                const elapsedMs = now.getTime() - baseDate.getTime();
                const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
                isCurrentlyAvailable = elapsedDays % interval === 0;
            }
        }
    }

    return {
        id: row.id,
        name: row.name,
        coverImageFileId: row.cover_image_file_id,
        coverImageUrl: row.cover_image_url ?? getTournamentCoverImagePublicUrl(row.cover_image_file_id),
        cardsCount: row.cards_count,
        playersCount: row.players_count,
        allowedFormats: (row.allowed_formats ?? []).filter((format): format is TournamentFormat => isValidTournamentFormat(format)),
        deckArchetypes: sanitizeArrayString(row.deck_archetypes),
        maxCardEnergy: row.max_card_energy,
        allowedTribes: sanitizeArrayString(row.allowed_tribes).filter((tribe) => isValidTournamentTribe(tribe)),
        allowMugic: row.allow_mugic,
        locationMode: row.location_mode,
        definedLocations: sanitizeArrayString(row.defined_locations),
        additionalRules: row.additional_rules,
        scheduleType: row.schedule_type,
        startAt: row.start_at,
        endAt: row.end_at,
        periodDays: row.period_days,
        isEnabled: row.is_enabled,
        isCurrentlyAvailable,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function validateTournamentPayload(payload: CreateTournamentRequestDto | UpdateTournamentRequestDto) {
    if (!payload.name.trim()) {
        throw new Error("Nome do torneio é obrigatório.");
    }

    if (payload.cardsCount < 1) {
        throw new Error("Número de cartas deve ser maior que zero.");
    }

    if (payload.playersCount < 1) {
        throw new Error("Número de jogadores deve ser maior que zero.");
    }

    if (!payload.allowedFormats.length) {
        throw new Error("Selecione pelo menos um formato.");
    }

    if (!payload.allowedFormats.every((format) => isValidTournamentFormat(format))) {
        throw new Error("Formato de torneio inválido.");
    }

    if (!isValidTournamentLocationMode(payload.locationMode)) {
        throw new Error("Modo de local inválido.");
    }

    if (payload.locationMode === "defined" && payload.definedLocations.length === 0) {
        throw new Error("Informe pelo menos um local definido para este torneio.");
    }

    if (!payload.allowedTribes.every((tribe) => isValidTournamentTribe(tribe))) {
        throw new Error("Há tribos inválidas nas regras do torneio.");
    }

    if (!isValidTournamentScheduleType(payload.scheduleType)) {
        throw new Error("Tipo de agendamento inválido.");
    }

    if (payload.scheduleType === "date_range") {
        if (!payload.startAt || !payload.endAt || !isIsoDate(payload.startAt) || !isIsoDate(payload.endAt)) {
            throw new Error("Informe data de início e fim válidas para o período do torneio.");
        }

        if (new Date(payload.endAt) < new Date(payload.startAt)) {
            throw new Error("A data de fim não pode ser menor que a data de início.");
        }
    }

    if (payload.scheduleType === "recurring_interval") {
        if (!payload.periodDays || payload.periodDays < 1) {
            throw new Error("No torneio recorrente, o período em dias deve ser maior que zero.");
        }

        if (payload.startAt && !isIsoDate(payload.startAt)) {
            throw new Error("Data base do torneio recorrente é inválida.");
        }
    }

    if (payload.maxCardEnergy !== null && payload.maxCardEnergy !== undefined && payload.maxCardEnergy < 0) {
        throw new Error("A energia máxima não pode ser negativa.");
    }
}

export async function listTournaments(referenceDate?: Date): Promise<TournamentDto[]> {
    const supabase = getSupabaseAdminClient();
    const tableName = getTournamentsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .select("id,name,cover_image_file_id,cover_image_url,cards_count,players_count,allowed_formats,deck_archetypes,max_card_energy,allowed_tribes,allow_mugic,location_mode,defined_locations,additional_rules,schedule_type,start_at,end_at,period_days,is_enabled,created_at,updated_at")
        .order("created_at", { ascending: false })
        .returns<SupabaseTournamentRow[]>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela de torneios antes de usar o módulo (veja supabase/schema.sql).`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return (data ?? []).map((row) => mapSupabaseTournamentRow(row, referenceDate));
}

export async function listAvailableTournaments(referenceDate?: Date): Promise<TournamentDto[]> {
    const rows = await listTournaments(referenceDate);
    return rows.filter((row) => row.isCurrentlyAvailable);
}

export async function createTournament(payload: CreateTournamentRequestDto): Promise<TournamentDto> {
    validateTournamentPayload(payload);

    const supabase = getSupabaseAdminClient();
    const tableName = getTournamentsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            name: payload.name.trim(),
            cover_image_file_id: payload.coverImageFileId?.trim() || null,
            cards_count: payload.cardsCount,
            players_count: payload.playersCount,
            allowed_formats: payload.allowedFormats,
            deck_archetypes: payload.deckArchetypes,
            max_card_energy: payload.maxCardEnergy ?? null,
            allowed_tribes: payload.allowedTribes,
            allow_mugic: payload.allowMugic,
            location_mode: payload.locationMode,
            defined_locations: payload.locationMode === "defined" ? payload.definedLocations : [],
            additional_rules: payload.additionalRules?.trim() || null,
            schedule_type: payload.scheduleType,
            start_at: payload.startAt ?? null,
            end_at: payload.scheduleType === "date_range" ? payload.endAt ?? null : null,
            period_days: payload.scheduleType === "recurring_interval" ? payload.periodDays ?? null : null,
            is_enabled: payload.isEnabled,
        })
        .select("id,name,cover_image_file_id,cover_image_url,cards_count,players_count,allowed_formats,deck_archetypes,max_card_energy,allowed_tribes,allow_mugic,location_mode,defined_locations,additional_rules,schedule_type,start_at,end_at,period_days,is_enabled,created_at,updated_at")
        .single<SupabaseTournamentRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela de torneios antes de cadastrar.`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapSupabaseTournamentRow(data);
}

export async function updateTournamentById(
    tournamentId: string,
    payload: UpdateTournamentRequestDto,
): Promise<TournamentDto> {
    validateTournamentPayload(payload);

    const supabase = getSupabaseAdminClient();
    const tableName = getTournamentsTableName();

    const { data, error } = await supabase
        .from(tableName)
        .update({
            name: payload.name.trim(),
            cover_image_file_id: payload.coverImageFileId?.trim() || null,
            cards_count: payload.cardsCount,
            players_count: payload.playersCount,
            allowed_formats: payload.allowedFormats,
            deck_archetypes: payload.deckArchetypes,
            max_card_energy: payload.maxCardEnergy ?? null,
            allowed_tribes: payload.allowedTribes,
            allow_mugic: payload.allowMugic,
            location_mode: payload.locationMode,
            defined_locations: payload.locationMode === "defined" ? payload.definedLocations : [],
            additional_rules: payload.additionalRules?.trim() || null,
            schedule_type: payload.scheduleType,
            start_at: payload.startAt ?? null,
            end_at: payload.scheduleType === "date_range" ? payload.endAt ?? null : null,
            period_days: payload.scheduleType === "recurring_interval" ? payload.periodDays ?? null : null,
            is_enabled: payload.isEnabled,
        })
        .eq("id", tournamentId)
        .select("id,name,cover_image_file_id,cover_image_url,cards_count,players_count,allowed_formats,deck_archetypes,max_card_energy,allowed_tribes,allow_mugic,location_mode,defined_locations,additional_rules,schedule_type,start_at,end_at,period_days,is_enabled,created_at,updated_at")
        .single<SupabaseTournamentRow>();

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela de torneios antes de editar.`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }

    return mapSupabaseTournamentRow(data);
}

export async function deleteTournamentById(tournamentId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const tableName = getTournamentsTableName();

    const { error } = await supabase.from(tableName).delete().eq("id", tournamentId);

    if (error) {
        const supabaseError = error as SupabaseApiError;

        if (isMissingTableError(supabaseError)) {
            throw new Error(
                `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela de torneios antes de remover.`,
            );
        }

        throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
    }
}
