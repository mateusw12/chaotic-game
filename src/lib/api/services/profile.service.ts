import type { UpdateUserProfileRequestDto, UserProfileResponseDto } from "@/dto/user";
import { ApiClient } from "@/lib/api/api-client";

type UploadProfileImageResponseDto = {
    success: boolean;
    file: { path: string; publicUrl: string } | null;
    message?: string;
};

export class ProfileService {
    static async updateProfile(payload: UpdateUserProfileRequestDto) {
        const data = await ApiClient.patch<UserProfileResponseDto, UpdateUserProfileRequestDto>("/users/profile", payload);

        if (!data.success || !data.profile) {
            throw new Error(data.message ?? "Não foi possível atualizar o perfil.");
        }

        return data.profile;
    }

    static async uploadProfileImage(formData: FormData) {
        const data = await ApiClient.postFormData<UploadProfileImageResponseDto>("/users/uploads/profile", formData);

        if (!data.success || !data.file?.publicUrl) {
            throw new Error(data.message ?? "Falha ao enviar imagem de perfil.");
        }

        return data.file.publicUrl;
    }
}
