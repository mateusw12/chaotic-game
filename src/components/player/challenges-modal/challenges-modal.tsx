"use client";

import { Button, Card, Empty, List, Modal, Space, Tag, Typography } from "antd";
import type { ChallengeDto } from "@/dto/challenge";

type ChallengesModalProps = {
  open: boolean;
  loading: boolean;
  challenges: ChallengeDto[];
  actionChallengeId: string | null;
  challengeToConfirm: ChallengeDto | null;
  onClose: () => void;
  onAccept: (challenge: ChallengeDto) => void;
  onDecline: (challengeId: string) => void;
  onCancelConfirm: () => void;
  onConfirmAccept: () => void;
};

const { Text } = Typography;

function challengeStatusToTag(status: ChallengeDto["status"]) {
  if (status === "pending") {
    return <Tag color="processing">Pendente</Tag>;
  }

  if (status === "won") {
    return <Tag color="success">Vitória</Tag>;
  }

  if (status === "lost") {
    return <Tag color="error">Derrota</Tag>;
  }

  return <Tag>Recusado</Tag>;
}

function cardTypeLabel(cardType: string) {
  switch (cardType) {
    case "creature":
      return "Criatura";
    case "location":
      return "Local";
    case "mugic":
      return "Mugic";
    case "battlegear":
      return "Equipamento";
    case "attack":
      return "Ataque";
    default:
      return cardType;
  }
}

export function ChallengesModal({
  open,
  loading,
  challenges,
  actionChallengeId,
  challengeToConfirm,
  onClose,
  onAccept,
  onDecline,
  onCancelConfirm,
  onConfirmAccept,
}: ChallengesModalProps) {
  return (
    <>
      <Modal
        open={open}
        title="Desafios"
        onCancel={onClose}
        footer={null}
        width={760}
      >
        {loading ? (
          <Text>Carregando desafios...</Text>
        ) : challenges.length === 0 ? (
          <Empty description="Sem desafios para agora." />
        ) : (
          <List
            dataSource={challenges}
            renderItem={(challenge) => {
              const isPending = challenge.status === "pending";
              const isActing = actionChallengeId === challenge.id;

              return (
                <List.Item key={challenge.id}>
                  <Card size="small" style={{ width: "100%" }}>
                    <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                      <Space align="center" wrap>
                        <Text strong>{challenge.challengerName}</Text>
                        {challengeStatusToTag(challenge.status)}
                        {challenge.isBonus ? <Tag color="gold">Bônus</Tag> : null}
                      </Space>

                      <Text>
                        Batalha de {challenge.creaturesCount} criaturas • Recompensa: {challenge.rewardCardsCount} carta(s) + {challenge.rewardCoins} moedas{challenge.rewardDiamonds > 0 ? ` + ${challenge.rewardDiamonds} diamantes` : ""}
                      </Text>

                      {challenge.awardedCards.length > 0 ? (
                        <Text type="secondary">
                          Cartas recebidas: {challenge.awardedCards.map((card) => `${cardTypeLabel(card.cardType)} (${card.cardName ?? card.cardId})`).join(", ")}
                        </Text>
                      ) : null}

                      {isPending ? (
                        <Space>
                          <Button
                            type="primary"
                            loading={isActing}
                            onClick={() => onAccept(challenge)}
                          >
                            Aceitar
                          </Button>
                          <Button
                            danger
                            loading={isActing}
                            onClick={() => onDecline(challenge.id)}
                          >
                            Recusar
                          </Button>
                        </Space>
                      ) : null}
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(challengeToConfirm)}
        title="Confirmar desafio"
        onCancel={onCancelConfirm}
        onOk={onConfirmAccept}
        okText="Iniciar batalha"
        cancelText="Cancelar"
        confirmLoading={Boolean(challengeToConfirm && actionChallengeId === challengeToConfirm.id)}
      >
        {challengeToConfirm ? (
          <Text>
            Você vai iniciar uma batalha de {challengeToConfirm.creaturesCount} criaturas contra {challengeToConfirm.challengerName}. Deseja continuar?
          </Text>
        ) : null}
      </Modal>
    </>
  );
}
