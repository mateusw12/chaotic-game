export type SupabaseApiError = {
    code?: string;
    message: string;
};

export function isMissingTableError(error: SupabaseApiError): boolean {
    return error.code === "PGRST205";
}
