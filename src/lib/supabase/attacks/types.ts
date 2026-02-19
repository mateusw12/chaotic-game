import type { CardRarity } from "@/dto/creature";
import type { AttackAbilityDto, AttackElementValueDto } from "@/dto/attack";

export type SupabaseAttackRow = {
    id: string;
    name: string;
    file_name?: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    energy_cost: number;
    element_values: AttackElementValueDto[];
    abilities: AttackAbilityDto[];
    created_at: string;
    updated_at: string;
};
