import type { AttackDto, CreateAttackRequestDto } from "@/dto/attack";
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

type UploadFileApiResponse = {
    success: boolean;
    file: { imageFileId: string; path: string; publicUrl: string | null } | null;
    message?: string;
};

export class AttacksAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/attacks";

    static create(payload: CreateAttackRequestDto) {
        return this.createEntity<CreateAttackRequestDto, AttackDto, "attack">(
            this.resourcePath,
            payload,
            "attack",
        );
    }

    static update(id: string, payload: CreateAttackRequestDto) {
        return this.updateEntity<CreateAttackRequestDto, AttackDto, "attack">(
            this.resourcePath,
            id,
            payload,
            "attack",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<AttackDto, "attacks">(this.resourcePath, "attacks");
    }

    static importFromJson() {
        return ApiClient.post<ImportJsonApiResponse, Record<string, never>>(
            "/admin/attacks/import-json",
            {},
        );
    }

    static uploadImage(formData: FormData) {
        return ApiClient.postFormData<UploadFileApiResponse>("/admin/uploads/attacks", formData);
    }
}
