import type { CreatureTribe } from "@/dto/creature";
import type { LocationAbilityDto } from "@/dto/location";

export type BattleGearAbilityDto = LocationAbilityDto;

export type BattleGearDto = {
    id: string;
    name: string;
    imageFileId: string | null;
    imageUrl: string | null;
    allowedTribes: CreatureTribe[];
    allowedCreatureIds: string[];
    abilities: BattleGearAbilityDto[];
    createdAt: string;
    updatedAt: string;
};

export type CreateBattleGearRequestDto = {
    name: string;
    imageFileId?: string | null;
    allowedTribes?: CreatureTribe[];
    allowedCreatureIds?: string[];
    abilities: BattleGearAbilityDto[];
};

export type UpdateBattleGearRequestDto = CreateBattleGearRequestDto;

export type ListBattleGearResponseDto = {
    success: boolean;
    battlegear: BattleGearDto[];
    message?: string;
};

export type CreateBattleGearResponseDto = {
    success: boolean;
    battlegearItem: BattleGearDto | null;
    message?: string;
};

export type UpdateBattleGearResponseDto = {
    success: boolean;
    battlegearItem: BattleGearDto | null;
    message?: string;
};

export type DeleteBattleGearResponseDto = {
    success: boolean;
    message?: string;
};
