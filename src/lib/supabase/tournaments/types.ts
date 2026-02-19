import type { TournamentFormat, TournamentLocationMode, TournamentScheduleType } from "@/dto/tournament";

export type SupabaseTournamentRow = {
    id: string;
    name: string;
    cover_image_file_id: string | null;
    cover_image_url: string | null;
    cards_count: number;
    players_count: number;
    allowed_formats: TournamentFormat[];
    deck_archetypes: string[];
    max_card_energy: number | null;
    allowed_tribes: string[];
    allow_mugic: boolean;
    location_mode: TournamentLocationMode;
    defined_locations: string[];
    additional_rules: string | null;
    schedule_type: TournamentScheduleType;
    start_at: string | null;
    end_at: string | null;
    period_days: number | null;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
};
