import { UserProgressionOverviewDto } from "@/dto/progression";

export type ProfileViewProps = {
  name: string | null;
  nickName: string | null;
  imageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
  progressionOverview: UserProgressionOverviewDto | null;
};
