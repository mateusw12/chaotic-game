import type { CreditUserWalletRequestDto, CreditUserWalletResponseDto, UserWalletDto } from "@/dto/wallet";
import { ApiClient } from "@/lib/api/api-client";

export class WalletsAdminService {
    private static readonly resourcePath = "/admin/wallets";

    static async credit(payload: CreditUserWalletRequestDto): Promise<UserWalletDto> {
        const data = await ApiClient.post<CreditUserWalletResponseDto, CreditUserWalletRequestDto>(this.resourcePath, payload);

        if (!data.success || !data.wallet) {
            throw new Error(data.message ?? "Erro ao creditar saldo.");
        }

        return data.wallet;
    }
}
