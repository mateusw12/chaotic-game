"use client";

import { Card, Input, InputNumber, Select, Tabs } from "antd";
import styles from "../decks-view.module.css";
import type { DeckFilters } from "../decks-view.interface";
import { CARD_RARITY_OPTIONS, CREATURE_TRIBE_OPTIONS } from "@/dto/creature";
import { CARD_TYPE_OPTIONS } from "../decks-view.constants";
import type { TabsProps } from "antd";

type CollectionFiltersProps = {
  filters: DeckFilters;
  setFilters: (updater: (prev: DeckFilters) => DeckFilters) => void;
  collectionTabs: TabsProps["items"];
};

export default function CollectionFilters({ filters, setFilters, collectionTabs }: CollectionFiltersProps) {
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

      <Tabs items={collectionTabs} />
    </Card>
  );
}
