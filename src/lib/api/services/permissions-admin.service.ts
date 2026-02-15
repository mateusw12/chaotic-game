import type { UpdateUserRoleRequestDto, UpdateUserRoleResponseDto, UserPermissionDto, UserRole } from "@/dto/user";
import { ApiClient } from "@/lib/api/api-client";

export class PermissionsAdminService {
    static async updateUserRole(userId: string, role: UserRole): Promise<UserPermissionDto | null> {
        const data = await ApiClient.patch<UpdateUserRoleResponseDto, UpdateUserRoleRequestDto>(
            `/admin/users/${userId}/role`,
            { role },
        );

        if (!data.success) {
            throw new Error(data.message ?? "Falha ao atualizar role.");
        }

        return data.user;
    }
}
