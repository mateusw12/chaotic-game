import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type {
    UpdateUserProfileRequestDto,
    UserProfileResponseDto,
} from "@/dto/user";
import { getUserProfileByEmail, updateUserProfileByEmail } from "@/lib/supabase";

function normalizeNickName(value: unknown): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    return normalized.slice(0, 32);
}

function normalizeImageUrl(value: unknown): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    return normalized;
}

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: UserProfileResponseDto = {
            success: false,
            profile: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    try {
        const profile = await getUserProfileByEmail(email);

        const response: UserProfileResponseDto = {
            success: true,
            profile,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UserProfileResponseDto = {
            success: false,
            profile: null,
            message: error instanceof Error ? error.message : "Erro ao carregar perfil.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        const response: UserProfileResponseDto = {
            success: false,
            profile: null,
            message: "Usuário não autenticado.",
        };

        return NextResponse.json(response, { status: 401 });
    }

    const body = await request
        .json()
        .catch(() => ({} as Partial<UpdateUserProfileRequestDto>));

    const nickName = normalizeNickName(body.nickName);
    const imageUrl = normalizeImageUrl(body.imageUrl);

    const hasInvalidNick = body.nickName !== undefined && nickName === undefined;
    const hasInvalidImageUrl = body.imageUrl !== undefined && imageUrl === undefined;

    if (hasInvalidNick || hasInvalidImageUrl) {
        const response: UserProfileResponseDto = {
            success: false,
            profile: null,
            message: "Dados inválidos para atualização de perfil.",
        };

        return NextResponse.json(response, { status: 400 });
    }

    try {
        const profile = await updateUserProfileByEmail(email, {
            nickName,
            imageUrl,
        });

        const response: UserProfileResponseDto = {
            success: true,
            profile,
            message: "Perfil atualizado com sucesso.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: UserProfileResponseDto = {
            success: false,
            profile: null,
            message: error instanceof Error ? error.message : "Erro ao atualizar perfil.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
