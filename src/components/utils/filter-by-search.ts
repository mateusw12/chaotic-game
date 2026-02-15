import { normalizeValue } from "./normalize-value";

export function filterBySearch<T extends object>(
    dataSource: T[],
    searchFields: Array<keyof T>,
    searchValue: string,
): T[] {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
        return dataSource;
    }

    return dataSource.filter((row) =>
        searchFields.some((field) =>
            normalizeValue(row[field]).toLocaleLowerCase().includes(normalizedSearch),
        ),
    );
}
