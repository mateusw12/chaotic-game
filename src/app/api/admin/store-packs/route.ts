import { NextResponse } from "next/server";
import type {
    CreateAdminStorePackRequestDto,
    CreateAdminStorePackResponseDto,
    ListAdminStorePacksResponseDto,
} from "@/dto/store";
import { auth } from "@/lib/auth";
import { createAdminStorePack, getUserByEmail, listAdminStorePacks } from "@/lib/supabase";

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

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListAdminStorePacksResponseDto = {
                success: false,
                packs: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const packs = await listAdminStorePacks();

        const response: ListAdminStorePacksResponseDto = {
            success: true,
            packs,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListAdminStorePacksResponseDto = {
            success: false,
            packs: [],
            message: error instanceof Error ? error.message : "Erro ao listar pacotes da loja.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreateAdminStorePackResponseDto = {
                success: false,
                pack: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request
            .json()
            .catch(() => ({} as Partial<CreateAdminStorePackRequestDto>));

        const pack = await createAdminStorePack({
            name: body.name ?? "",
            description: body.description ?? "",
            imageFileId: body.imageFileId ?? null,
            cardsCount: Number(body.cardsCount ?? 0),
            cardTypes: body.cardTypes ?? [],
            allowedTribes: body.allowedTribes ?? [],
            tribeWeights: body.tribeWeights ?? {},
            rarityWeights: body.rarityWeights ?? { comum: 0, incomum: 0, rara: 0, super_rara: 0, ultra_rara: 0 },
            guaranteedMinRarity: body.guaranteedMinRarity ?? null,
            guaranteedCount: Number(body.guaranteedCount ?? 0),
            priceCoins: body.priceCoins ?? null,
            priceDiamonds: body.priceDiamonds ?? null,
            dailyLimit: body.dailyLimit ?? null,
            weeklyLimit: body.weeklyLimit ?? null,
            isActive: body.isActive ?? true,
        });

        const response: CreateAdminStorePackResponseDto = {
            success: true,
            pack,
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        const response: CreateAdminStorePackResponseDto = {
            success: false,
            pack: null,
            message: error instanceof Error ? error.message : "Erro ao criar pacote da loja.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
