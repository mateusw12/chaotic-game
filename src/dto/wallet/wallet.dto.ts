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

export type AdminUserWalletDto = {
    userId: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
    coins: number;
    diamonds: number;
};

export type ListAdminUserWalletsResponseDto = {
    success: boolean;
    wallets: AdminUserWalletDto[];
    message?: string;
};

export type CreditUserWalletRequestDto = {
    userId: string;
    coins?: number;
    diamonds?: number;
};

export type CreditUserWalletResponseDto = {
    success: boolean;
    wallet: UserWalletDto | null;
    message?: string;
};
