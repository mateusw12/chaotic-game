import type { CreateCreatureRequestDto, CreatureDto } from "@/dto/creature";
import { ApiClient } from "@/lib/api/api-client";
import { BaseCrudService } from "@/lib/api/base-crud-service";

type UploadFileApiResponse = {
    success: boolean;
    file: { imageFileId: string; path: string; publicUrl: string | null } | null;
    message?: string;
};

export class CreaturesAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/creatures";

    static create(payload: CreateCreatureRequestDto) {
        return this.createEntity<CreateCreatureRequestDto, CreatureDto, "creature">(
            this.resourcePath,
            payload,
            "creature",
        );
    }

    static update(id: string, payload: CreateCreatureRequestDto) {
        return this.updateEntity<CreateCreatureRequestDto, CreatureDto, "creature">(
            this.resourcePath,
            id,
            payload,
            "creature",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<CreatureDto, "creatures">(this.resourcePath, "creatures");
    }

    static uploadImage(formData: FormData) {
        return ApiClient.postFormData<UploadFileApiResponse>("/admin/uploads/creatures", formData);
    }
}
