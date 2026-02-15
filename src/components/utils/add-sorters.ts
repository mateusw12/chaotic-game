import type { ColumnsType, ColumnType } from "antd/es/table";
import { compareValues } from "./compare-values";

export function addSorters<T extends object>(columns: ColumnsType<T>): ColumnsType<T> {
    return columns.map((column) => {
        if ("children" in column && column.children) {
            return {
                ...column,
                children: addSorters(column.children),
            };
        }

        const currentColumn = column as ColumnType<T>;

        if (currentColumn.sorter) {
            return currentColumn;
        }

        const dataIndex = currentColumn.dataIndex;

        if (!dataIndex || Array.isArray(dataIndex) || typeof dataIndex !== "string") {
            return currentColumn;
        }

        return {
            ...currentColumn,
            sorter: (leftRecord: T, rightRecord: T) => {
                const leftValue = (leftRecord as Record<string, unknown>)[dataIndex];
                const rightValue = (rightRecord as Record<string, unknown>)[dataIndex];

                return compareValues(leftValue, rightValue);
            },
            sortDirections: ["ascend", "descend"],
        };
    });
}
