"use client";

import { Modal, Space, Input, Select, InputNumber, Tabs, Button, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { DeckCollectionCardDto } from "@/dto/deck";
import type { UserCardType } from "@/dto/progression";
import { CARD_RARITY_OPTIONS, type CardRarity, type CreatureTribe } from "@/dto/creature";
import { CARD_TYPE_OPTIONS } from "../decks-view.constants";
import styles from "../decks-view.module.css";

const { Text } = Typography;

interface Props {
  open: boolean;
  viewedDeck: { name: string } | null;
  onClose: () => void;
  modalNameFilter: string;
  setModalNameFilter: (v: string) => void;
  modalRarityFilter: CardRarity | undefined;
  setModalRarityFilter: (v: CardRarity | undefined) => void;
  modalEnergyFilter: number | undefined;
  setModalEnergyFilter: (v: number | undefined) => void;
  viewedDeckCardsByType: Record<UserCardType, Array<DeckCollectionCardDto & { deckQuantity: number }>>;
  tribeClass: (tribe: CreatureTribe | null) => string;
  handleChangeDeckCardQuantity: (cardKey: string, quantity: number) => Promise<void>;
  isCardDeckActionPending: (cardType: UserCardType, cardId: string) => boolean;
  updatePending: boolean;
  loadingLogoIcon: React.ReactNode;
}

export default function ViewDeckModal({
  open,
  viewedDeck,
  onClose,
  modalNameFilter,
  setModalNameFilter,
  modalRarityFilter,
  setModalRarityFilter,
  modalEnergyFilter,
  setModalEnergyFilter,
  viewedDeckCardsByType,
  tribeClass,
  handleChangeDeckCardQuantity,
  isCardDeckActionPending,
  updatePending,
  loadingLogoIcon,
}: Props) {
  return (
    <Modal
      title={viewedDeck ? `Visualizar deck: ${viewedDeck.name}` : "Visualizar deck"}
      className={styles.viewDeckModal}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
    >
      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
        <div className={styles.filters}>
          <Input
            placeholder="Filtrar por nome"
            value={modalNameFilter}
            onChange={(event) => setModalNameFilter(event.target.value)}
          />
          <Select
            allowClear
            placeholder="Raridade"
            options={CARD_RARITY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            value={modalRarityFilter}
            onChange={(value) => setModalRarityFilter(value as CardRarity | undefined)}
          />
          <InputNumber
            min={0}
            placeholder="Energia"
            value={modalEnergyFilter}
            onChange={(value) => setModalEnergyFilter(value ?? undefined)}
            style={{ width: "100%" }}
          />
        </div>

        <Tabs
          items={CARD_TYPE_OPTIONS.map((tab) => ({
            key: tab.value,
            label: tab.label,
            children: (
              <div className={styles.cardsGrid}>
                {viewedDeckCardsByType[tab.value].map((card) => {
                  const cardKey = `${card.cardType}:${card.cardId}`;

                  return (
                    <div key={`modal-${cardKey}`} className={`${styles.cardButton} ${tribeClass(card.primaryTribe)}`}>
                      <div className={styles.cardImageWrap}>
                        <img src={card.imageUrl} alt={card.name} className={styles.cardImage} />
                      </div>
                      <Text className={styles.cardName}>{card.name}</Text>
                      <Space style={{ marginTop: 6, width: "100%", justifyContent: "space-between" }}>
                        <InputNumber
                          min={0}
                          value={card.deckQuantity}
                          disabled={updatePending}
                          onChange={(value) => { void handleChangeDeckCardQuantity(cardKey, Number(value ?? 0)); }}
                        />
                        <Button
                          danger
                          type="text"
                          size="small"
                          aria-label="Remover carta"
                          title="Remover carta"
                          icon={isCardDeckActionPending(card.cardType, card.cardId) ? loadingLogoIcon : <DeleteOutlined />}
                          disabled={updatePending && !isCardDeckActionPending(card.cardType, card.cardId)}
                          onClick={() => void handleChangeDeckCardQuantity(cardKey, 0)}
                        />
                      </Space>
                    </div>
                  );
                })}
              </div>
            ),
          }))}
        />
      </Space>
    </Modal>
  );
}
