export function normalizeValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    if (Array.isArray(value)) {
        return value.map((item) => normalizeValue(item)).join(" ");
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}
