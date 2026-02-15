import type { AbilityDto, CreateAbilityRequestDto } from "@/dto/ability";
import { ApiClient } from "@/lib/api/api-client";
import { BaseCrudService } from "@/lib/api/base-crud-service";

type ImportJsonApiResponse = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
    message?: string;
};

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

    static importFromJson() {
        return ApiClient.post<ImportJsonApiResponse, Record<string, never>>(
            "/admin/abilities/import-json",
            {},
        );
    }
}
