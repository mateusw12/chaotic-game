import type {
    ChooseStarterTribeRequestDto,
    ChooseStarterTribeResponseDto,
    GetStarterProgressionStatusResponseDto,
    StarterSelectableTribe,
} from "@/dto/progression";
import { ApiClient } from "@/lib/api/api-client";

export class StarterProgressionService {
    static async getStarterStatus() {
        const data = await ApiClient.request<GetStarterProgressionStatusResponseDto>("/progression/starter", {
            method: "GET",
            headers: {
                "Cache-Control": "no-store",
            },
        });

        if (!data.success) {
            throw new Error(data.message ?? "Não foi possível verificar a tribo inicial.");
        }

        return data;
    }

    static async chooseStarterTribe(tribe: StarterSelectableTribe) {
        const data = await ApiClient.post<ChooseStarterTribeResponseDto, ChooseStarterTribeRequestDto>(
            "/progression/starter",
            { tribe },
        );

        if (!data.success) {
            throw new Error(data.message ?? "Não foi possível confirmar a tribo inicial.");
        }

        return data;
    }
}
