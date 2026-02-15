import type {
    AdminStorePackDto,
    CreateAdminStorePackRequestDto,
    DeleteAdminStorePackResponseDto,
    ListAdminStorePacksResponseDto,
    UpdateAdminStorePackRequestDto,
    UpdateAdminStorePackResponseDto,
} from "@/dto/store";
import { BaseCrudService } from "@/lib/api/base-crud-service";
import { ApiClient } from "@/lib/api/api-client";

type UploadImageApiResponse = {
    success: boolean;
    file: {
        imageFileId: string;
        path: string;
        publicUrl: string | null;
    } | null;
    message?: string;
};

export class StorePacksAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/store-packs";

    static getAll() {
        return this.listEntities<AdminStorePackDto, "packs">(this.resourcePath, "packs");
    }

    static create(payload: CreateAdminStorePackRequestDto) {
        return this.createEntity<CreateAdminStorePackRequestDto, AdminStorePackDto, "pack">(
            this.resourcePath,
            payload,
            "pack",
        );
    }

    static update(packId: string, payload: UpdateAdminStorePackRequestDto) {
        return this.updateEntity<UpdateAdminStorePackRequestDto, AdminStorePackDto, "pack">(
            this.resourcePath,
            packId,
            payload,
            "pack",
        );
    }

    static async remove(packId: string) {
        const data = await ApiClient.delete<DeleteAdminStorePackResponseDto>(`${this.resourcePath}/${packId}`);

        if (!data.success) {
            throw new Error(data.message ?? "Falha ao remover pacote da loja.");
        }
    }

    static async uploadImage(formData: FormData) {
        const data = await ApiClient.postFormData<UploadImageApiResponse>("/admin/uploads/store-packs", formData);

        if (!data.success || !data.file) {
            throw new Error(data.message ?? "Falha ao enviar imagem do pacote.");
        }

        return data;
    }
}
