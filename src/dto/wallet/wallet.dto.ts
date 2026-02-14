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
    coins: number;
    diamonds: number;
};
