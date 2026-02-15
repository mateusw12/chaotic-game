import type { AbilityDto, CreateAbilityRequestDto } from "@/dto/ability";
import { BaseCrudService } from "@/lib/api/base-crud-service";

export class AbilitiesAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/abilities";

    static create(payload: CreateAbilityRequestDto) {
        return this.createEntity<CreateAbilityRequestDto, AbilityDto, "ability">(
            this.resourcePath,
            payload,
            "ability",
        );
    }

    static update(id: string, payload: CreateAbilityRequestDto) {
        return this.updateEntity<CreateAbilityRequestDto, AbilityDto, "ability">(
            this.resourcePath,
            id,
            payload,
            "ability",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<AbilityDto, "abilities">(this.resourcePath, "abilities");
    }
}
