import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { LocationAbilityDto, LocationInitiativeElement } from "@/dto/location";

export type SupabaseLocationRow = {
    id: string;
    name: string;
    file_name: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    initiative_elements: LocationInitiativeElement[];
    tribes: CreatureTribe[];
    abilities: LocationAbilityDto[];
    created_at: string;
    updated_at: string;
};
