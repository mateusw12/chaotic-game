import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    ListUsersPermissionsResponseDto,
} from "@/dto/user";
import { getUserRoleByEmail, listUsersWithRoles } from "@/lib/supabase";

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: ListUsersPermissionsResponseDto = {
            success: false,
            users: [],
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const currentRole = await getUserRoleByEmail(email);

        if (currentRole !== "admin") {
            const response: ListUsersPermissionsResponseDto = {
                success: false,
                users: [],
                message: "Acesso negado. Apenas admin pode listar permissões.",
            };

            return NextResponse.json(response, { status: 403 });
        }

        const users = await listUsersWithRoles();

        const response: ListUsersPermissionsResponseDto = {
            success: true,
            users,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListUsersPermissionsResponseDto = {
            success: false,
            users: [],
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao listar permissões de usuários.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
