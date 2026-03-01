"use client";

import { Card, Input, InputNumber, Pagination, Select, Spin, Tabs } from "antd";
import styles from "../decks-view.module.css";
import type { DeckFilters } from "../decks-view.interface";
import { CARD_RARITY_OPTIONS, CREATURE_TRIBE_OPTIONS } from "@/dto/creature";
import { CARD_TYPE_OPTIONS } from "../decks-view.constants";
import type { DeckCollectionPaginationDto } from "@/dto/deck";
import type { TabsProps } from "antd";

type CollectionFiltersProps = {
  filters: DeckFilters;
  setFilters: (updater: (prev: DeckFilters) => DeckFilters) => void;
  collectionTabs: TabsProps["items"];
  collectionPagination: DeckCollectionPaginationDto;
  onCollectionPageChange: (page: number) => void;
  collectionLoading: boolean;
};

export default function CollectionFilters({
  filters,
  setFilters,
  collectionTabs,
  collectionPagination,
  onCollectionPageChange,
  collectionLoading,
}: CollectionFiltersProps) {
  return (
    <Card className={styles.panel}>
      <div className={styles.filters}>
        <Input
          placeholder="Filtrar por nome"
          value={filters.name}
          onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Select
          allowClear
          placeholder="Tribo"
          options={CREATURE_TRIBE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
          value={filters.tribe}
          onChange={(value) => setFilters((prev) => ({ ...prev, tribe: value }))}
        />
        <InputNumber
          min={0}
          placeholder="Energia"
          value={filters.energy}
          onChange={(value) => setFilters((prev) => ({ ...prev, energy: value ?? undefined }))}
          style={{ width: "100%" }}
        />
        <Select
          allowClear
          placeholder="Raridade"
          options={CARD_RARITY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
          value={filters.rarity}
          onChange={(value) => setFilters((prev) => ({ ...prev, rarity: value }))}
        />
        <Select
          allowClear
          placeholder="Tipo de carta"
          options={CARD_TYPE_OPTIONS}
          value={filters.cardType}
          onChange={(value) => setFilters((prev) => ({ ...prev, cardType: value }))}
        />
      </div>

      <Spin spinning={collectionLoading}>
        <Tabs items={collectionTabs} />
      </Spin>

      <Pagination
        style={{ marginTop: 12 }}
        size="small"
        current={collectionPagination.page}
        pageSize={collectionPagination.pageSize}
        total={collectionPagination.total}
        showSizeChanger={false}
        disabled={collectionLoading}
        onChange={onCollectionPageChange}
      />
    </Card>
  );
}
