import { NextResponse } from "next/server";
import type {
    DeleteAdminStorePackResponseDto,
    UpdateAdminStorePackRequestDto,
    UpdateAdminStorePackResponseDto,
} from "@/dto/store";
import { auth } from "@/lib/auth";
import { deleteAdminStorePack, getUserByEmail, updateAdminStorePack } from "@/lib/supabase";

type RouteContext = {
    params: Promise<{
        packId: string;
    }>;
};

async function ensureAdminBySessionEmail(email: string | null | undefined) {
    if (!email) {
        return { ok: false as const, status: 401, message: "Usuário não autenticado." };
    }

    const user = await getUserByEmail(email);

    if (!user) {
        return { ok: false as const, status: 404, message: "Usuário não encontrado." };
    }

    if (user.role !== "admin") {
        return { ok: false as const, status: 403, message: "Acesso negado. Apenas admin pode gerenciar pacotes da loja." };
    }

    return { ok: true as const };
}

export async function PATCH(request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: UpdateAdminStorePackResponseDto = {
                success: false,
                pack: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { packId } = await context.params;
        const body = await request
            .json()
            .catch(() => ({} as Partial<UpdateAdminStorePackRequestDto>));

        const pack = await updateAdminStorePack(packId, body);

        const response: UpdateAdminStorePackResponseDto = {
            success: true,
            pack,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UpdateAdminStorePackResponseDto = {
            success: false,
            pack: null,
            message: error instanceof Error ? error.message : "Erro ao atualizar pacote da loja.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: DeleteAdminStorePackResponseDto = {
                success: false,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const { packId } = await context.params;
        await deleteAdminStorePack(packId);

        const response: DeleteAdminStorePackResponseDto = {
            success: true,
            message: "Pacote removido com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: DeleteAdminStorePackResponseDto = {
            success: false,
            message: error instanceof Error ? error.message : "Erro ao remover pacote da loja.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
