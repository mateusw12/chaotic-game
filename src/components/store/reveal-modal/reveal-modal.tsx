"use client";

import React, { useState } from "react";
import { Button, Card, Space, Tag, Typography, Modal } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { StoreRevealCardDto, StoreSellCardInputDto } from "@/dto/store";
import styles from "../store-view.module.css";

const REVEAL_CARD_FALLBACK_IMAGE = "/assets/card/verso.png";

const { Text } = Typography;

type RevealModalProps = {
  open: boolean;
  onClose: () => void;
  revealedCards: StoreRevealCardDto[];
  totalSellValue: number;
  sellingAll: boolean;
  sellingCardKey: string | null;
  loadingIcon?: React.ReactNode;
  onSellCards: (cards: StoreSellCardInputDto[], mode: "single" | "all") => Promise<void>;
  getEnumDescription?: (value: any) => string;
};

export default function RevealModal({
  open,
  onClose,
  revealedCards,
  totalSellValue,
  sellingAll,
  sellingCardKey,
  loadingIcon,
  onSellCards,
}: RevealModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCards, setPendingCards] = useState<StoreSellCardInputDto[] | null>(null);
  const [pendingMode, setPendingMode] = useState<"single" | "all" | null>(null);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [confirming, setConfirming] = useState(false);

  function computeTotalFor(cards: StoreSellCardInputDto[]) {
    return cards.reduce((sum, c) => {
      const match = revealedCards.find((rc) => rc.cardType === c.cardType && rc.cardId === c.cardId);
      return sum + ((match?.sellValue ?? 0) * (c.quantity ?? 1));
    }, 0);
  }

  function requestSell(cards: StoreSellCardInputDto[], mode: "single" | "all") {
    const total = computeTotalFor(cards);
    setPendingCards(cards);
    setPendingMode(mode);
    setPendingTotal(total);
    setConfirmOpen(true);
  }

  async function confirmSell() {
    if (!pendingCards || !pendingMode) return;
    setConfirming(true);
    try {
      await onSellCards(pendingCards, pendingMode);
    } finally {
      setConfirming(false);
      setConfirmOpen(false);
      setPendingCards(null);
      setPendingMode(null);
      setPendingTotal(0);
    }
  }
  return (
    <Modal
      open={open}
      title="Abertura do Pacote"
      className={styles.revealModal}
      onCancel={onClose}
      footer={[
        <div key="meta" className={styles.revealFooterMeta}>
          <div className={styles.revealFooterLeft}>
            <Tag className={styles.revealFooterCount}>{revealedCards.length} cartas</Tag>
            <Tag className={styles.revealFooterTotal}>Valor total: {totalSellValue} moedas</Tag>
          </div>
          <div className={styles.revealFooterActions}>
            <Button
              key="sellDuplicates"
              size="small"
              className={styles.sellDuplicatesButton}
              disabled={!revealedCards.some((c) => c.isDuplicateInCollection)}
              onClick={() => requestSell(
                revealedCards
                  .filter((c) => c.isDuplicateInCollection)
                  .map((card) => ({ cardType: card.cardType, cardId: card.cardId, quantity: 1 })),
                "all",
              )}
            >
              Vender duplicadas
            </Button>

            <Button
              key="sellAll"
              size="small"
              type="primary"
              disabled={revealedCards.length === 0}
              icon={sellingAll ? loadingIcon : undefined}
              onClick={() => requestSell(
                revealedCards.map((card) => ({ cardType: card.cardType, cardId: card.cardId, quantity: 1 })),
                "all",
              )}
            >
              Vender todas
            </Button>
          </div>
        </div>,
        <Button key="close" type="primary" onClick={onClose}>
          Fechar
        </Button>,
      ]}
      width={1180}
    >
      <div className={styles.revealHeader}>
        <Text className={styles.revealTitle}>Cartas Reveladas</Text>
      </div>

      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key={`reveal-${revealedCards.length}`}
            className={styles.revealGrid}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.05,
                },
              },
            }}
          >
            {revealedCards.map((card, index) => (
              <motion.div
                key={`${card.cardType}-${card.cardId}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.92, rotateY: -40, rotateX: 6 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotateY: 0,
                    rotateX: 0,
                    transition: { type: "spring", stiffness: 160, damping: 20, mass: 0.7 },
                  },
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={styles.revealMotionItem}
              >
                <Card size="small" className={styles.revealCard}>
                  <div className={styles.revealImageWrap}>
                    {card.isDuplicateInCollection ? (
                      <Tag color="gold" className={styles.duplicateBadge}>Duplicada</Tag>
                    ) : null}
                    <Image
                      src={card.cardImageUrl ?? REVEAL_CARD_FALLBACK_IMAGE}
                      alt={card.cardName ?? card.cardType}
                      width={280}
                      height={360}
                      unoptimized
                      className={styles.cardImage}
                    />
                  </div>

                  <Space orientation="vertical" size={6} style={{ marginTop: 8, width: "100%" }}>
                    <Text strong className={styles.revealCardName}>{card.cardName ?? card.cardType}</Text>
                    <Space size={6} wrap className={styles.revealMetaRow}>
                      {/* kept intentionally small */}
                    </Space>

                    <Button
                      className={styles.sellButton}
                      size="small"
                      block
                      disabled={sellingAll}
                      icon={sellingCardKey === `${card.cardType}:${card.cardId}` ? loadingIcon : undefined}
                      onClick={() => void onSellCards([
                        { cardType: card.cardType, cardId: card.cardId, quantity: 1 },
                      ], "single")}
                    >
                      <span className={styles.sellButtonLabel}>Vender</span>
                      <span className={styles.sellPrice}>🪙 {card.sellValue}</span>
                    </Button>
                  </Space>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Modal
        open={confirmOpen}
        title="Confirmar venda"
        onCancel={() => setConfirmOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmOpen(false)} disabled={confirming}>Cancelar</Button>,
          <Button key="confirm" type="primary" loading={confirming} onClick={() => void confirmSell()}>
            Confirmar
          </Button>,
        ]}
        width={520}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{pendingCards?.length ?? 0} cartas</div>
          <div style={{ color: "#dfffe8", fontWeight: 700 }}>Valor total: {pendingTotal} moedas</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>Deseja confirmar a venda? Esta ação não pode ser desfeita.</div>
        </div>
      </Modal>
    </Modal>
  );
}
