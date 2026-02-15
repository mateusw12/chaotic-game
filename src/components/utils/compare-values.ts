import { normalizeValue } from "./normalize-value";

export function compareValues(left: unknown, right: unknown): number {
    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }

    const leftValue = normalizeValue(left).toLocaleLowerCase();
    const rightValue = normalizeValue(right).toLocaleLowerCase();

    return leftValue.localeCompare(rightValue);
}
