export type CodexTrialsViewProps = {
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
  level: number;
};

export type LeagueSpec = {
  id: number;
  tier: string;
  name: string;
  boss: string;
  objective: string;
  rewardFocus: string;
  rewardHighlights: string[];
  imgSymbol?: string;
  imgBoss?: string;
};

export type LeagueRuntime = {
  isActive: boolean;
  status: "active" | "completed" | "locked";
  label: string;
  percent: number;
};

export type BattleFormat = "1x1" | "3x3" | "6x6" | "10x10";

