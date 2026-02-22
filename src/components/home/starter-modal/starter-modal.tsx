"use client";

import React from "react";
import Image from "next/image";
import {
  Button,
  Col,
  Row,
  Space,
  Tag,
  Typography,
  Modal,
  Tooltip,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import styles from "@/app/page.module.css";
import { LoadingLogo } from "@/components/shared/loading-logo/loading-logo";
import type { StarterSelectableTribe } from "@/dto/progression";

const { Title, Paragraph, Text } = Typography;

type StarterModalProps = {
  open: boolean;
  starterTribes: Array<{ label: string; value: StarterSelectableTribe; description?: string }>;
  starterSelection: StarterSelectableTribe | null;
  setStarterSelection: (v: StarterSelectableTribe) => void;
  lockedStarterTribe: StarterSelectableTribe | null;
  submittingStarterChoice: boolean;
  handleConfirmStarterTribe: () => Promise<void> | void;
};

export default function StarterModal({
  open,
  starterTribes,
  starterSelection,
  setStarterSelection,
  lockedStarterTribe,
  submittingStarterChoice,
  handleConfirmStarterTribe,
}: StarterModalProps) {
  return (
    <Modal
      open={open}
      title={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
      footer={null}
      className={styles.starterModal}
      width={760}
      maskStyle={{ backgroundColor: 'rgba(2,6,23,0.85)' }}
    >
      <div className={`${styles.starterCard} ${styles.starterModalContent}`}>
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <div className={styles.starterHeroHeader}>
            <Title level={2} className={styles.starterTitle}>
              Escolha sua Tribo
            </Title>
            <Paragraph className={styles.starterSubtitle}>
              Defina sua tribo para ativar o deck inicial, desbloquear bônus de XP e iniciar sua progressão competitiva.
            </Paragraph>
            <Text className={styles.starterPhase}>Fase 1/1 · Seleção de Tribo</Text>
          </div>

          <Row gutter={[10, 10]}>
            {starterTribes.map((tribe) => {
              const selected = starterSelection === tribe.value;
              const disabled = submittingStarterChoice || Boolean(lockedStarterTribe && lockedStarterTribe !== tribe.value);

              return (
                <Col xs={24} sm={12} lg={6} key={tribe.value}>
                  <button
                    type="button"
                    className={`${styles.starterTribeCard} ${selected ? styles.starterTribeCardSelected : ""}`}
                    onClick={() => setStarterSelection(tribe.value)}
                    disabled={disabled}
                  >
                    <Tooltip title={tribe.description ?? "Sem descrição"} placement="topRight">
                      <InfoCircleOutlined className={styles.starterInfoIcon} />
                    </Tooltip>

                    <div className={styles.starterTribeImageWrap}>
                      <Image
                        src={`/assets/symbols/${String(tribe.value)}.png`}
                        alt={tribe.label}
                        width={56}
                        height={56}
                        className={styles.starterTribeImage}
                        unoptimized
                        style={{ backgroundColor: "transparent" }}
                      />
                    </div>
                    <Text strong>{tribe.label}</Text>
                    <Text type="secondary" className={styles.starterTribeDescription} title={tribe.description}>
                      {tribe.description ?? ""}
                    </Text>
                    {selected ? <Tag color="green">Pronto para iniciar</Tag> : <Tag>Selecionar tribo</Tag>}
                  </button>
                </Col>
              );
            })}
          </Row>

          <div className={styles.starterRewardStrip}>
            <Text>🎁 Pacote 1: 10 criaturas da tribo escolhida</Text>
            <Text>🎁 Pacote 2: 5 cartas entre Mugic e Equipamentos</Text>
            <Text>🎁 Pacote 3: 10 cartas entre Locais e Ataques (máx. 3 locais)</Text>
          </div>

          {lockedStarterTribe ? (
            <Text type="secondary">Sua tribo inicial já está definida. Confirme para receber o deck inicial.</Text>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <Button
              type="primary"
              size="large"
              className={styles.starterCtaButton}
              icon={submittingStarterChoice ? <LoadingLogo /> : undefined}
              onClick={() => void handleConfirmStarterTribe()}
              disabled={!starterSelection || submittingStarterChoice}
            >
              Iniciar jornada e receber deck
            </Button>
          </div>
        </Space>
      </div>
    </Modal>
  );
}
