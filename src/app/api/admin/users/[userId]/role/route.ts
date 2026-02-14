import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    UpdateUserRoleRequestDto,
    UpdateUserRoleResponseDto,
    UserRole,
} from "@/dto/user";
import { getUserRoleByEmail, updateUserRoleById } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        userId: string;
    }>;
};

function isValidRole(role: string): role is UserRole {
    return role === "user" || role === "admin";
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: UpdateUserRoleResponseDto = {
            success: false,
            user: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const currentRole = await getUserRoleByEmail(email);

        if (currentRole !== "admin") {
            const response: UpdateUserRoleResponseDto = {
                success: false,
                user: null,
                message: "Acesso negado. Apenas admin pode alterar permissões.",
            };

            return NextResponse.json(response, { status: 403 });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateUserRoleRequestDto>));

        if (!body.role || !isValidRole(body.role)) {
            const response: UpdateUserRoleResponseDto = {
                success: false,
                user: null,
                message: "Role inválida. Use 'user' ou 'admin'.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const { userId } = await context.params;
        const updatedUser = await updateUserRoleById(userId, body.role);

        const response: UpdateUserRoleResponseDto = {
            success: true,
            user: updatedUser,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateUserRoleResponseDto = {
            success: false,
            user: null,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao atualizar role do usuário.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
