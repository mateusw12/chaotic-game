"use client";

import { Modal, Space, Tag, InputNumber, Button, Typography } from "antd";
import type { DeckCollectionCardDto } from "@/dto/deck";
import styles from "../decks-view.module.css";
import { UserCardType } from "@/dto/progression";

const { Text } = Typography;

interface Props {
  open: boolean;
  selectedCollectionCard: DeckCollectionCardDto | null;
  onClose: () => void;
  selectedCardDeckNames: string[];
  selectedSellUnitValue: number;
  selectedSellTotal: number;
  sellQuantity: number;
  setSellQuantity: (value: number) => void;
  isCardDeckActionPending: (cardType: UserCardType, cardId: string) => boolean;
  loadingLogoIcon: React.ReactNode;
  updatePending: boolean;
  handleAddCardToDeck: (card: DeckCollectionCardDto) => Promise<void>;
  sellPending: boolean;
  handleSellSelectedCard: () => Promise<void>;
}

export default function ActionCardModal({
  open,
  selectedCollectionCard,
  onClose,
  selectedCardDeckNames,
  selectedSellUnitValue,
  selectedSellTotal,
  sellQuantity,
  setSellQuantity,
  isCardDeckActionPending,
  loadingLogoIcon,
  updatePending,
  handleAddCardToDeck,
  sellPending,
  handleSellSelectedCard,
}: Props) {
  return (
    <Modal
      title={selectedCollectionCard ? `Carta: ${selectedCollectionCard.name}` : "Carta"}
      className={styles.actionCardModal}
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
    >
      {selectedCollectionCard ? (
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Text type="secondary">Gerencie esta carta de forma rápida: adicione ao deck ou venda por moedas.</Text>

          {selectedCardDeckNames.length > 0 ? (
            <div className={styles.actionCardDeckWarn}>
              <Text strong>Esta carta está em {selectedCardDeckNames.length} deck(s):</Text>
              <Space wrap style={{ marginTop: 8 }}>
                {selectedCardDeckNames.map((deckName) => (
                  <Tag key={deckName} color="purple">{deckName}</Tag>
                ))}
              </Space>
            </div>
          ) : null}

          <div className={styles.actionCardSummary}>
            <div>
              <Text className={styles.actionCardLabel}>Disponível</Text>
              <div><Tag>{selectedCollectionCard.quantity}x</Tag></div>
            </div>
            <div>
              <Text className={styles.actionCardLabel}>Valor unitário</Text>
              <div><Tag color="gold">{selectedSellUnitValue} moedas</Tag></div>
            </div>
            <div>
              <Text className={styles.actionCardLabel}>Total da venda</Text>
              <div><Tag color="gold">{selectedSellTotal} moedas</Tag></div>
            </div>
          </div>

          <div className={styles.actionCardQuantity}>
            <Text className={styles.actionCardLabel}>Quantidade para venda</Text>
            <InputNumber
              min={1}
              max={selectedCollectionCard.quantity}
              value={sellQuantity}
              onChange={(value) => setSellQuantity(Math.max(1, Number(value ?? 1)))}
              style={{ width: "100%" }}
            />
          </div>

          <div className={styles.actionCardButtons}>
            <Button
              block
              icon={isCardDeckActionPending(selectedCollectionCard.cardType, selectedCollectionCard.cardId) ? loadingLogoIcon : undefined}
              disabled={updatePending && !isCardDeckActionPending(selectedCollectionCard.cardType, selectedCollectionCard.cardId)}
              onClick={() => void handleAddCardToDeck(selectedCollectionCard)}
            >
              Adicionar ao deck
            </Button>
            <Button
              danger
              type="primary"
              block
              icon={sellPending ? loadingLogoIcon : undefined}
              disabled={sellPending}
              onClick={() => void handleSellSelectedCard()}
            >
              Vender carta
            </Button>
          </div>
        </Space>
      ) : null}
    </Modal>
  );
}
