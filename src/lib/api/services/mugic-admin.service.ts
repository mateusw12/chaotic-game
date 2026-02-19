import type { CreateMugicRequestDto, MugicDto } from "@/dto/mugic";
import { ApiClient } from "@/lib/api/api-client";
import { BaseCrudService } from "@/lib/api/base-crud-service";

type UploadFileApiResponse = {
    success: boolean;
    file: { imageFileId: string; path: string; publicUrl: string | null } | null;
    message?: string;
};

type ImportJsonApiResponse = {
    success: boolean;
    imported: number;
    updated: number;
    skipped: number;
    fileName: string;
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

export class MugicAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/mugic";

    static create(payload: CreateMugicRequestDto) {
        return this.createEntity<CreateMugicRequestDto, MugicDto, "mugic">(
            this.resourcePath,
            payload,
            "mugic",
        );
    }

    static update(id: string, payload: CreateMugicRequestDto) {
        return this.updateEntity<CreateMugicRequestDto, MugicDto, "mugic">(
            this.resourcePath,
            id,
            payload,
            "mugic",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<MugicDto, "mugics">(this.resourcePath, "mugics");
    }

    static importFromJson() {
        return ApiClient.post<ImportJsonApiResponse, Record<string, never>>(
            "/admin/mugic/import-json",
            {},
        );
    }

    static uploadImage(formData: FormData) {
        return ApiClient.postFormData<UploadFileApiResponse>("/admin/uploads/mugic", formData);
    }

    static importImages(formData: FormData) {
        return ApiClient.postFormData<ImportImagesApiResponse>(
            "/admin/mugic/import-images",
            formData,
        );
    }
}
