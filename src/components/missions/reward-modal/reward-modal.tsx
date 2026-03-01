"use client";

import { Button, Modal, Tag, Typography } from "antd";
import styles from "../missions-view.module.css";

const { Title, Text } = Typography;

export type MissionRewardModalState = {
  missionTitle: string;
  coins: number;
  diamonds: number;
  xp: number;
  card: {
    cardType: string;
    cardName: string | null;
    rarity: string;
    imageUrl: string | null;
  } | null;
};

type RewardModalProps = {
  open: boolean;
  reward: MissionRewardModalState | null;
  onClose: () => void;
  fallbackImage: string;
};

export function RewardModal({ open, reward, onClose, fallbackImage }: RewardModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Continuar
        </Button>,
      ]}
      centered
      title="Recompensa recebida"
    >
      {reward ? (
        <div className={styles.rewardModalContent}>
          <Text type="secondary">Missão: {reward.missionTitle}</Text>

          <div className={styles.rewardMainRow}>
            <div className={styles.rewardStatsColumn}>
              <div className={styles.rewardStatBox}>
                <Text className={styles.rewardStatLabel}>🪙 Moedas</Text>
                <Title level={4} style={{ margin: 0 }} className={styles.rewardStatValue}>🪙 {reward.coins}</Title>
              </div>
              <div className={styles.rewardStatBox}>
                <Text className={styles.rewardStatLabel}>💎 Diamantes</Text>
                <Title level={4} style={{ margin: 0 }} className={styles.rewardStatValue}>💎 {reward.diamonds}</Title>
              </div>
              <div className={styles.rewardStatBox}>
                <Text className={styles.rewardStatLabel}>⭐ XP</Text>
                <Title level={4} style={{ margin: 0 }} className={styles.rewardStatValue}>⭐ {reward.xp}</Title>
              </div>
            </div>

            {reward.card ? (
              <div className={styles.awardedCardPreview}>
                <div className={styles.awardedCardImageWrap}>
                  <img
                    src={reward.card.imageUrl ?? fallbackImage}
                    alt={reward.card.cardName ?? reward.card.cardType}
                    className={styles.awardedCardImage}
                  />
                </div>
                <Text className={styles.awardedCardType}>{reward.card.cardType}</Text>
                <Title level={4} style={{ margin: "2px 0" }}>{reward.card.cardName ?? "Carta Misteriosa"}</Title>
                <Tag color="purple">{reward.card.rarity}</Tag>
              </div>
            ) : (
              <div className={styles.noCardBox}>
                <Text type="secondary">Esta missão não concedeu carta.</Text>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
