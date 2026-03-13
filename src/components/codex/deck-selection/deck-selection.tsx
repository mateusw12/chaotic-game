"use client";

import { Modal, Button, Space, Typography } from "antd";
import styles from "../codex-trials-view.module.css";
import type { LeagueSpec } from "../codex-trials-view.interface";

const { Text } = Typography;

type DeckSelectionProps = {
  open: boolean;
  onCancel: () => void;
  league: LeagueSpec | null;
  format: string | null;
};

export default function DeckSelection({ open, onCancel, league, format }: DeckSelectionProps) {
  const normalizedFormat = format ?? "3x3";

  return (
    <Modal
      title="Escolha seu deck"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="battle" type="default" href={`/battle?source=codex&format=${normalizedFormat}`}>
          Iniciar batalha
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          Fechar
        </Button>,
      ]}
    >
      <Space orientation="vertical" size={10} style={{ width: "100%" }}>
        <Text>
          <strong>Liga:</strong> {league?.name ?? "-"}
        </Text>
        <Text>
          <strong>Formato escolhido:</strong> {format ?? "-"}
        </Text>
        <Text className={styles.deckSelectionPlaceholder}>
          A seleção de deck será exibida aqui em breve.
        </Text>
      </Space>
    </Modal>
  );
}
