import { ApiClient } from "@/lib/api/api-client";
import type { BattleFormat, BattleSetupResponseDto } from "@/components/battle/types";

export type GetBattleSetupParams = {
  format: BattleFormat;
  mode: "deck" | "collection";
  deckId?: string | null;
};

export class BattleService {
  static async getSetup(params: GetBattleSetupParams) {
    const searchParams = new URLSearchParams();
    searchParams.set("format", String(params.format));
    searchParams.set("mode", params.mode);

    if (params.mode === "deck" && params.deckId) {
      searchParams.set("deckId", params.deckId);
    }

    return ApiClient.get<BattleSetupResponseDto>(`/battle/setup?${searchParams.toString()}`);
  }
}
