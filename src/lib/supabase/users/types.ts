import type { UserRole } from "@/dto/user";

export type SupabaseUserRow = {
    id: string;
    role: UserRole;
    provider: string;
    provider_account_id: string;
    email: string;
    name: string | null;
    nick_name: string | null;
    image_url: string | null;
    last_login_at: string;
    created_at: string;
    updated_at: string;
};

export type SupabasePermissionUserRow = {
    id: string;
    name: string | null;
    email: string;
    image_url: string | null;
    role: UserRole;
    updated_at: string;
};
