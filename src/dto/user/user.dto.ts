export type UserRole = "user" | "admin";

export type SaveLoggedUserRequestDto = {
  provider: string;
  providerAccountId: string;
  email: string;
  name: string | null;
  nickName?: string | null;
  imageUrl: string | null;
};

export type SavedUserDto = {
  id: string;
  role: UserRole;
  provider: string;
  providerAccountId: string;
  email: string;
  name: string | null;
  nickName: string | null;
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

export type UserPermissionDto = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  role: UserRole;
  updatedAt: string;
};

export type UserProfileDto = {
  id: string;
  email: string;
  name: string | null;
  nickName: string | null;
  imageUrl: string | null;
};

export type UpdateUserProfileRequestDto = {
  nickName?: string | null;
  imageUrl?: string | null;
};

export type UserProfileResponseDto = {
  success: boolean;
  profile: UserProfileDto | null;
  message?: string;
};

export type ListUsersPermissionsResponseDto = {
  success: boolean;
  users: UserPermissionDto[];
  message?: string;
};

export type UpdateUserRoleRequestDto = {
  role: UserRole;
};

export type UpdateUserRoleResponseDto = {
  success: boolean;
  user: UserPermissionDto | null;
  message?: string;
};
