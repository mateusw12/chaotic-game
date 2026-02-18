import type { CreateLocationRequestDto, LocationDto } from "@/dto/location";
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

type UploadFileApiResponse = {
    success: boolean;
    file: { imageFileId: string; path: string; publicUrl: string | null } | null;
    message?: string;
};

export class LocationsAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/locations";

    static create(payload: CreateLocationRequestDto) {
        return this.createEntity<CreateLocationRequestDto, LocationDto, "location">(
            this.resourcePath,
            payload,
            "location",
        );
    }

    static update(id: string, payload: CreateLocationRequestDto) {
        return this.updateEntity<CreateLocationRequestDto, LocationDto, "location">(
            this.resourcePath,
            id,
            payload,
            "location",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<LocationDto, "locations">(this.resourcePath, "locations");
    }

    static importFromJson() {
        return ApiClient.post<ImportJsonApiResponse, Record<string, never>>(
            "/admin/locations/import-json",
            {},
        );
    }

    static uploadImage(formData: FormData) {
        return ApiClient.postFormData<UploadFileApiResponse>("/admin/uploads/locations", formData);
    }

    static importImages(formData: FormData) {
        return ApiClient.postFormData<ImportImagesApiResponse>(
            "/admin/locations/import-images",
            formData,
        );
    }
}
