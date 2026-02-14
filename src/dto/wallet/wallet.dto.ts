export type UserWalletDto = {
    id: string;
    userId: string;
    coins: number;
    diamonds: number;
    createdAt: string;
    updatedAt: string;
};

export type UserDashboardDto = {
    userName: string | null;
    userImageUrl: string | null;
    userRole: "user" | "admin";
    coins: number;
    diamonds: number;
    level: number;
    xpTotal: number;
    xpCurrentLevel: number;
    xpNextLevel: number;
};
