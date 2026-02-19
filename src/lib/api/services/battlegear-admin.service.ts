import type { BattleGearDto, CreateBattleGearRequestDto } from "@/dto/battlegear";
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

type ImportImagesApiResponse = {
    success: boolean;
    uploaded: number;
    updated: number;
    skipped: number;
    matched: number;
    message?: string;
    unmatchedFiles?: string[];
    failedFiles?: Array<{ fileName: string; reason: string }>;
};

export class BattleGearAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/battlegear";

    static create(payload: CreateBattleGearRequestDto) {
        return this.createEntity<CreateBattleGearRequestDto, BattleGearDto, "battlegearItem">(
            this.resourcePath,
            payload,
            "battlegearItem",
        );
    }

    static update(id: string, payload: CreateBattleGearRequestDto) {
        return this.updateEntity<CreateBattleGearRequestDto, BattleGearDto, "battlegearItem">(
            this.resourcePath,
            id,
            payload,
            "battlegearItem",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<BattleGearDto, "battlegear">(this.resourcePath, "battlegear");
    }

    static importFromJson() {
        return ApiClient.post<ImportJsonApiResponse, Record<string, never>>(
            "/admin/battlegear/import-json",
            {},
        );
    }

    static uploadImage(formData: FormData) {
        return ApiClient.postFormData<UploadFileApiResponse>("/admin/uploads/battlegear", formData);
    }

    static importImages(formData: FormData) {
        return ApiClient.postFormData<ImportImagesApiResponse>(
            "/admin/battlegear/import-images",
            formData,
        );
    }
}
