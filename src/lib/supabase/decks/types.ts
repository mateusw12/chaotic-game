import type { UserCardType } from "@/dto/progression";

export type SupabaseUserDeckRow = {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export type SupabaseUserDeckCardRow = {
    id: string;
    deck_id: string;
    card_type: UserCardType;
    card_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
};
