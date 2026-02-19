import type { CardRarity, CreatureElement, CreatureTribe } from "@/dto/creature";

export type SupabaseCreatureRow = {
    id: string;
    name: string;
    file_name: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    tribe: CreatureTribe;
    power: number;
    courage: number;
    speed: number;
    wisdom: number;
    mugic: number;
    energy: number;
    dominant_elements: CreatureElement[];
    support_ability_ids: string[];
    support_ability_name: string[];
    brainwashed_ability_ids: string[];
    brainwashed_ability_name: string[];
    equipment_note: string | null;
    created_at: string;
    updated_at: string;
};
