import type { ClaimMissionResponseDto, GetMissionsResponseDto } from "@/dto/mission";
import { ApiClient } from "@/lib/api/api-client";

export class MissionsService {
  static async getOverview() {
    const data = await ApiClient.request<GetMissionsResponseDto>("/missions", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!data.success || !data.overview) {
      throw new Error(data.message ?? "Não foi possível carregar as missões.");
    }

    return data.overview;
  }

  static async claimMission(missionId: string) {
    const data = await ApiClient.request<ClaimMissionResponseDto>(`/missions/${missionId}/claim`, {
      method: "POST",
    });

    if (!data.success || !data.mission || !data.wallet) {
      throw new Error(data.message ?? "Não foi possível resgatar a missão.");
    }

    return data;
  }
}