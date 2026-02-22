"use client";

import { Modal, Space, Button, Typography } from "antd";
import styles from "../codex-trials-view.module.css";
import type { BattleFormat, LeagueSpec } from "../codex-trials-view.interface";

const { Text } = Typography;

type FormatSelectionProps = {
  open: boolean;
  onCancel: () => void;
  selectedLeague: LeagueSpec | null;
  formats: Array<{ value: BattleFormat; label: string; description?: string }>;
  onSelectFormat: (format: BattleFormat) => void;
};

export default function FormatSelection({ open, onCancel, selectedLeague, formats, onSelectFormat }: FormatSelectionProps) {
  return (
    <Modal
      title={`Escolha o formato${selectedLeague ? ` · ${selectedLeague.name}` : ""}`}
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Space orientation="vertical" size={10} style={{ width: "100%" }}>
        <Text>Selecione o formato da batalha para iniciar esta liga.</Text>
        {formats.map((formatOption) => (
          <Button
            key={formatOption.value}
            block
            className={styles.formatButton}
            onClick={() => onSelectFormat(formatOption.value)}
          >
            {formatOption.label}
          </Button>
        ))}
      </Space>
    </Modal>
  );
}
