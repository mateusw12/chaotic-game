import type { GetStorePacksResponseDto, PurchaseStorePackRequestDto, PurchaseStorePackResponseDto } from "@/dto/store";
import { ApiClient } from "@/lib/api/api-client";

export class StoreService {
    static async getPacks() {
        const data = await ApiClient.request<GetStorePacksResponseDto>("/store/packs", {
            method: "GET",
            headers: {
                "Cache-Control": "no-store",
            },
        });

        if (!data.success || !data.wallet) {
            throw new Error(data.message ?? "Erro ao carregar loja.");
        }

        return data;
    }

    static async purchase(packId: string) {
        const data = await ApiClient.post<PurchaseStorePackResponseDto, PurchaseStorePackRequestDto>(
            "/store/purchase",
            { packId },
        );

        if (!data.success || !data.wallet) {
            throw new Error(data.message ?? "Não foi possível concluir a compra.");
        }

        return data;
    }
}
