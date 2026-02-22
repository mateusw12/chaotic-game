"use client";

import { Button, Card, Input, InputNumber, Space, Select, Typography } from "antd";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DeckCollectionCardDto, DeckDto } from "@/dto/deck";
import type { UserCardType } from "@/dto/progression";
import { CARD_TYPE_OPTIONS } from "../decks-view.constants";
import styles from "../decks-view.module.css";

const { Text } = Typography;

interface DeckManagerProps {
  newDeckName: string;
  setNewDeckName: (value: string) => void;
  createDeckMutation: UseMutationResult<any, unknown, string, unknown>;
  loadingLogoIcon: React.ReactNode;
  notification: any;
  decks: DeckDto[];
  selectedDeck: DeckDto | null;
  setSelectedDeckId: (id: string | null) => void;
  setViewDeckId: (id: string | null) => void;
  removeDeckMutation: UseMutationResult<any, unknown, string, unknown>;
  deckCardTypeFilter: UserCardType | undefined;
  setDeckCardTypeFilter: (value: UserCardType | undefined) => void;
  selectedDeckCards: Array<DeckDto["cards"][number]>;
  collectionByKey: Map<string, DeckCollectionCardDto>;
  updateDeckMutation: UseMutationResult<any, unknown, any, unknown>;
  handleChangeDeckCardQuantity: (cardKey: string, quantity: number) => Promise<void>;
  isCardDeckActionPending: (cardType: UserCardType, cardId: string) => boolean;
}

export default function DeckManager({
  newDeckName,
  setNewDeckName,
  createDeckMutation,
  loadingLogoIcon,
  notification,
  decks,
  selectedDeck,
  setSelectedDeckId,
  setViewDeckId,
  removeDeckMutation,
  deckCardTypeFilter,
  setDeckCardTypeFilter,
  selectedDeckCards,
  collectionByKey,
  updateDeckMutation,
  handleChangeDeckCardQuantity,
  isCardDeckActionPending,
}: DeckManagerProps) {
  return (
    <Card className={styles.panel}>
      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
        <div className={styles.deckHeader}>
          <Text strong>Gerenciar decks</Text>
        </div>

        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Nome do novo deck"
            value={newDeckName}
            onChange={(event) => setNewDeckName(event.target.value)}
          />
          <Button
            type="primary"
            icon={createDeckMutation.isPending ? loadingLogoIcon : undefined}
            disabled={createDeckMutation.isPending}
            onClick={() => {
              if (!newDeckName.trim()) {
                notification.warning({ message: "Informe o nome do deck." });
                return;
              }

              void createDeckMutation.mutateAsync(newDeckName);
            }}
          >
            Criar
          </Button>
        </Space.Compact>

        <div className={styles.deckList}>
          {decks.map((deck) => (
            <div key={deck.id} className={styles.deckRow}>
              <Space>
                <Button type={selectedDeck?.id === deck.id ? "primary" : "default"} onClick={() => setSelectedDeckId(deck.id)}>
                  {deck.name}
                </Button>
                <Button onClick={() => setViewDeckId(deck.id)}>Visualizar</Button>
              </Space>
              <Button
                danger
                icon={removeDeckMutation.isPending ? loadingLogoIcon : undefined}
                disabled={removeDeckMutation.isPending}
                onClick={() => void removeDeckMutation.mutateAsync(deck.id)}
              >
                Remover
              </Button>
            </div>
          ))}
        </div>

        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong>Cartas do deck</Text>
          <Select
            allowClear
            placeholder="Filtrar tipo"
            options={CARD_TYPE_OPTIONS}
            value={deckCardTypeFilter}
            onChange={(value) => setDeckCardTypeFilter(value)}
            style={{ width: 190 }}
          />
        </Space>

        <div className={styles.deckCards}>
          {selectedDeckCards.map((entry) => {
            const item = collectionByKey.get(`${entry.cardType}:${entry.cardId}`);
            const key = `${entry.cardType}:${entry.cardId}`;

            return (
              <div key={key} className={styles.deckCardRow}>
                <Text>{item?.name ?? `${entry.cardType} ${entry.cardId.slice(0, 6)}`}</Text>
                <InputNumber
                  min={0}
                  value={entry.quantity}
                  disabled={updateDeckMutation.isPending}
                  onChange={(value) => {
                    void handleChangeDeckCardQuantity(key, Number(value ?? 0));
                  }}
                />
                <Button
                  danger
                  icon={isCardDeckActionPending(entry.cardType, entry.cardId) ? loadingLogoIcon : undefined}
                  disabled={updateDeckMutation.isPending && !isCardDeckActionPending(entry.cardType, entry.cardId)}
                  onClick={() => void handleChangeDeckCardQuantity(key, 0)}
                >
                  X
                </Button>
              </div>
            );
          })}
        </div>
      </Space>
    </Card>
  );
}
