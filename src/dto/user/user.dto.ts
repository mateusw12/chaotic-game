export type SaveLoggedUserRequestDto = {
  provider: string;
  providerAccountId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

export type SavedUserDto = {
  id: string;
  provider: string;
  providerAccountId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveLoggedUserResponseDto = {
  success: boolean;
  user: SavedUserDto | null;
  message?: string;
};
