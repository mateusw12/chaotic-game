import { ApiClient } from "@/lib/api/api-client";

type PackMetaResponse = {
  packRarity: string | null;
  packImage: string | null;
  cards: any[];
  bonusLocation?: { id: string; name: string; imageUrl?: string | null } | null;
  bonusMugic?: { id: string; name: string; imageUrl?: string | null } | null;
  claimed?: boolean;
};

export class CodexTrialsService {
  static async getPackMetadata(league?: string) {
    const q = league ? `?pack=1&count=0&league=${encodeURIComponent(league)}` : `?pack=1&count=0`;
    return ApiClient.get<PackMetaResponse>(`/codex-trials/random-creatures${q}`);
  }

  static async claimPack(league?: string) {
    return ApiClient.post<{ success: boolean; message?: string }, { league?: string }>(`/codex-trials/claim-pack`, { league });
  }

  static async getClaimedLeagues() {
    return ApiClient.get<{ success: boolean; claimed: string[] }>(`/codex-trials/claimed-leagues`);
  }

  static async getPackCards(league?: string) {
    const q = league ? `?pack=1&count=3&league=${encodeURIComponent(league)}` : `?pack=1&count=3`;
    return ApiClient.get<PackMetaResponse>(`/codex-trials/random-creatures${q}`);
  }
}

export default CodexTrialsService;
