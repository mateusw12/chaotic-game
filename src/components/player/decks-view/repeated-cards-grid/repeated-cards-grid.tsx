"use client";

import React from "react";
import { Button, Space, Tag, Typography } from "antd";
import type { DeckCollectionCardDto } from "@/dto/deck";
import type { CreatureTribe } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";
import styles from "../decks-view.module.css";

const { Text } = Typography;

type RepeatedCardsGridProps = {
  cards: DeckCollectionCardDto[];
  tribeClass: (tribe: CreatureTribe | null) => string;
  cardDeckNamesMap: Map<string, string[]>;
  onCardClick: (card: DeckCollectionCardDto) => void;
  onAddCard: (card: DeckCollectionCardDto) => Promise<void> | void;
  isCardDeckActionPending: (cardType: UserCardType, cardId: string) => boolean;
  updatePending: boolean;
  loadingLogoIcon: React.ReactNode;
};

export default function RepeatedCardsGrid({
  cards,
  tribeClass,
  cardDeckNamesMap,
  onCardClick,
  onAddCard,
  isCardDeckActionPending,
  updatePending,
  loadingLogoIcon,
}: RepeatedCardsGridProps) {
  return (
    <div className={styles.cardsGrid}>
      {cards.map((card) => (
        <div
          key={`repeated-${card.cardType}:${card.cardId}`}
          className={`${styles.cardButton} ${tribeClass(card.primaryTribe)}`}
          onClick={() => onCardClick(card)}
        >
          <div className={styles.cardImageWrap}>
            <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
          </div>
          <Text className={styles.cardName}>{card.name}</Text>
          {(cardDeckNamesMap.get(`${card.cardType}:${card.cardId}`)?.length ?? 0) > 0 ? (
            <Tag color="cyan" style={{ marginTop: 6, marginInlineEnd: 0 }}>
              Em {cardDeckNamesMap.get(`${card.cardType}:${card.cardId}`)?.length} deck(s)
            </Tag>
          ) : null}
          <Space style={{ marginTop: 6, width: "100%", justifyContent: "space-between" }}>
            <Tag>{card.quantity}x</Tag>
            <Button
              size="small"
              type="primary"
              icon={isCardDeckActionPending(card.cardType as UserCardType, card.cardId) ? loadingLogoIcon : undefined}
              disabled={updatePending}
              onClick={(event) => {
                event.stopPropagation();
                void onAddCard(card);
              }}
            >
              Adicionar
            </Button>
          </Space>
        </div>
      ))}
    </div>
  );
}
