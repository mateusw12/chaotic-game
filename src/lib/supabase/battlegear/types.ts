import type { CardRarity, CreatureTribe } from "@/dto/creature";
import type { BattleGearAbilityDto } from "@/dto/battlegear";

export type SupabaseBattleGearRow = {
    id: string;
    name: string;
    file_name?: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    allowed_tribes: CreatureTribe[];
    allowed_creature_ids: string[];
    abilities: BattleGearAbilityDto[];
    created_at: string;
    updated_at: string;
};
