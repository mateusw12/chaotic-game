"use client";

import { useMemo, useState } from "react";
import { Input, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { addSorters, filterBySearch } from "@/components/utils";

type SearchableDataTableProps<T extends object> = {
    rowKey: string | ((record: T) => string);
    columns: ColumnsType<T>;
    dataSource: T[];
    searchFields: Array<keyof T>;
    searchPlaceholder?: string;
    pageSize?: number;
    scrollX?: number;
};

export function SearchableDataTable<T extends object>({
    rowKey,
    columns,
    dataSource,
    searchFields,
    searchPlaceholder = "Buscar...",
    pageSize = 8,
    scrollX,
}: SearchableDataTableProps<T>) {
    const [searchValue, setSearchValue] = useState("");

    const sortableColumns = useMemo(() => addSorters(columns), [columns]);

    const filteredData = useMemo(
        () => filterBySearch(dataSource, searchFields, searchValue),
        [dataSource, searchFields, searchValue],
    );

    return (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
            <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                allowClear
            />

            <Table<T>
                rowKey={rowKey}
                columns={sortableColumns}
                dataSource={filteredData}
                pagination={{ pageSize }}
                scroll={scrollX ? { x: scrollX } : undefined}
            />
        </Space>
    );
}
