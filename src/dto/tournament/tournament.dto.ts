import { CREATURE_TRIBES, type CreatureTribe } from "@/dto/creature";

export const TOURNAMENT_FORMATS = ["1x1", "3x3", "5x5", "7x7"] as const;

export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

export const TOURNAMENT_SCHEDULE_TYPES = ["date_range", "recurring_interval"] as const;

export type TournamentScheduleType = (typeof TOURNAMENT_SCHEDULE_TYPES)[number];

export const TOURNAMENT_LOCATION_MODES = ["defined", "random"] as const;

export type TournamentLocationMode = (typeof TOURNAMENT_LOCATION_MODES)[number];

export const TOURNAMENT_FORMAT_OPTIONS: Array<{ value: TournamentFormat; label: string }> = [
    { value: "1x1", label: "1x1" },
    { value: "3x3", label: "3x3" },
    { value: "5x5", label: "5x5" },
    { value: "7x7", label: "7x7" },
];

export const TOURNAMENT_SCHEDULE_TYPE_OPTIONS: Array<{ value: TournamentScheduleType; label: string }> = [
    { value: "date_range", label: "Data de início e fim" },
    { value: "recurring_interval", label: "Recorrente por período" },
];

export const TOURNAMENT_LOCATION_MODE_OPTIONS: Array<{ value: TournamentLocationMode; label: string }> = [
    { value: "defined", label: "Locais definidos" },
    { value: "random", label: "Locais aleatórios" },
];

export const TOURNAMENT_TRIBE_OPTIONS: Array<{ value: CreatureTribe; label: string }> = [
    { value: "overworld", label: "OverWorld" },
    { value: "underworld", label: "UnderWorld" },
    { value: "mipedian", label: "Mipedian" },
    { value: "marrillian", label: "M'arrillian" },
    { value: "danian", label: "Danian" },
    { value: "ancient", label: "Ancient" },
];

export type TournamentDto = {
    id: string;
    name: string;
    coverImageFileId: string | null;
    coverImageUrl: string | null;
    cardsCount: number;
    playersCount: number;
    allowedFormats: TournamentFormat[];
    deckArchetypes: string[];
    maxCardEnergy: number | null;
    allowedTribes: CreatureTribe[];
    allowMugic: boolean;
    locationMode: TournamentLocationMode;
    definedLocations: string[];
    additionalRules: string | null;
    scheduleType: TournamentScheduleType;
    startAt: string | null;
    endAt: string | null;
    periodDays: number | null;
    isEnabled: boolean;
    isCurrentlyAvailable: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreateTournamentRequestDto = {
    name: string;
    coverImageFileId?: string | null;
    cardsCount: number;
    playersCount: number;
    allowedFormats: TournamentFormat[];
    deckArchetypes: string[];
    maxCardEnergy?: number | null;
    allowedTribes: CreatureTribe[];
    allowMugic: boolean;
    locationMode: TournamentLocationMode;
    definedLocations: string[];
    additionalRules?: string | null;
    scheduleType: TournamentScheduleType;
    startAt?: string | null;
    endAt?: string | null;
    periodDays?: number | null;
    isEnabled: boolean;
};

export type UpdateTournamentRequestDto = CreateTournamentRequestDto;

export type ListTournamentsResponseDto = {
    success: boolean;
    tournaments: TournamentDto[];
    message?: string;
};

export type CreateTournamentResponseDto = {
    success: boolean;
    tournament: TournamentDto | null;
    message?: string;
};

export type UpdateTournamentResponseDto = {
    success: boolean;
    tournament: TournamentDto | null;
    message?: string;
};

export type DeleteTournamentResponseDto = {
    success: boolean;
    message?: string;
};

export function isValidTournamentFormat(value: string): value is TournamentFormat {
    return TOURNAMENT_FORMATS.includes(value as TournamentFormat);
}

export function isValidTournamentScheduleType(value: string): value is TournamentScheduleType {
    return TOURNAMENT_SCHEDULE_TYPES.includes(value as TournamentScheduleType);
}

export function isValidTournamentLocationMode(value: string): value is TournamentLocationMode {
    return TOURNAMENT_LOCATION_MODES.includes(value as TournamentLocationMode);
}

export function isValidTournamentTribe(value: string): value is CreatureTribe {
    return CREATURE_TRIBES.includes(value as CreatureTribe);
}
