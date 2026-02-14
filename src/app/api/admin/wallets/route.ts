import { NextResponse } from "next/server";
import {
    type CreditUserWalletRequestDto,
    type CreditUserWalletResponseDto,
    type ListAdminUserWalletsResponseDto,
} from "@/dto/wallet";
import { auth } from "@/lib/auth";
import {
    creditUserWalletByUserId,
    getUserRoleByEmail,
    listAdminUserWallets,
} from "@/lib/supabase";

async function ensureAdminByEmail(email: string | null | undefined) {
    if (!email) {
        return {
            ok: false as const,
            status: 401,
            message: "Usuário não autenticado.",
        };
    }

    const role = await getUserRoleByEmail(email);

    if (role !== "admin") {
        return {
            ok: false as const,
            status: 403,
            message: "Acesso negado. Apenas admin pode gerenciar saldos.",
        };
    }

    return { ok: true as const };
}

export async function GET() {
    const session = await auth();

    try {
        const access = await ensureAdminByEmail(session?.user?.email);

        if (!access.ok) {
            const response: ListAdminUserWalletsResponseDto = {
                success: false,
                wallets: [],
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const wallets = await listAdminUserWallets();

        const response: ListAdminUserWalletsResponseDto = {
            success: true,
            wallets,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ListAdminUserWalletsResponseDto = {
            success: false,
            wallets: [],
            message: error instanceof Error ? error.message : "Erro ao listar saldos.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminByEmail(session?.user?.email);

        if (!access.ok) {
            const response: CreditUserWalletResponseDto = {
                success: false,
                wallet: null,
                message: access.message,
            };

            return NextResponse.json(response, { status: access.status });
        }

        const body = await request.json().catch(() => ({} as Partial<CreditUserWalletRequestDto>));

        if (!body.userId) {
            const response: CreditUserWalletResponseDto = {
                success: false,
                wallet: null,
                message: "Informe o usuário que receberá o crédito.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const coins = Math.max(0, Math.trunc(body.coins ?? 0));
        const diamonds = Math.max(0, Math.trunc(body.diamonds ?? 0));

        if (coins === 0 && diamonds === 0) {
            const response: CreditUserWalletResponseDto = {
                success: false,
                wallet: null,
                message: "Informe ao menos moedas ou diamantes maiores que zero.",
            };

            return NextResponse.json(response, { status: 400 });
        }

        const wallet = await creditUserWalletByUserId(body.userId, coins, diamonds);

        const response: CreditUserWalletResponseDto = {
            success: true,
            wallet,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: CreditUserWalletResponseDto = {
            success: false,
            wallet: null,
            message: error instanceof Error ? error.message : "Erro ao creditar saldo.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
