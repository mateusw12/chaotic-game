import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { MugicAbilityDto } from "@/dto/mugic";

export type SupabaseMugicRow = {
    id: string;
    name: string;
    file_name?: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    tribes: CreatureTribe[];
    cost: number;
    abilities: MugicAbilityDto[];
    created_at: string;
    updated_at: string;
};
