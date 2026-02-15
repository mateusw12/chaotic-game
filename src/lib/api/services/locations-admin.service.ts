import type { CreateLocationRequestDto, LocationDto } from "@/dto/location";
import { ApiClient } from "@/lib/api/api-client";
import { BaseCrudService } from "@/lib/api/base-crud-service";

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

    static uploadImage(formData: FormData) {
        return ApiClient.postFormData<UploadFileApiResponse>("/admin/uploads/locations", formData);
    }
}
