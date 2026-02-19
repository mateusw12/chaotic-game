import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdminClient() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error(
            "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.",
        );
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export function sanitizeFileName(fileName: string) {
    const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
    return normalized.replace(/-+/g, "-");
}

export type StorageApiError = {
    name?: string;
    message: string;
    statusCode?: number;
};
