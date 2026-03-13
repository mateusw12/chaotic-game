"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Progress, Space, Tabs, Tag, Typography, message } from "antd";
import type { MissionDto } from "@/dto/mission";
import { PlayerShell } from "@/components/player/player-shell";
import { getCardRarityLabel, getCardTypeLabel, resolveCardImageUrl } from "@/components/utils";
import { MissionsService } from "@/lib/api/service";
import { RewardModal, type MissionRewardModalState } from "./reward-modal/reward-modal";
import styles from "./missions-view.module.css";

type MissionsViewProps = {
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
  level: number;
};

const { Title, Text } = Typography;
const REWARD_CARD_FALLBACK_IMAGE = "/assets/card/verso.png";

function rewardLabel(mission: MissionDto): string {
  const chunks: string[] = [];
  chunks.push(`${mission.reward.coins} moedas`);
  chunks.push(`${mission.reward.diamonds} diamantes`);
  chunks.push(`${mission.reward.xp} XP`);

  if (mission.reward.cardType && mission.reward.cardRarity) {
    chunks.push(`1 carta ${mission.reward.cardRarity}`);
  }

  if (mission.reward.canGrantFreePack) {
    chunks.push("chance de pack grátis");
  }

  return chunks.join(" • ");
}

function periodLabel(period: MissionDto["period"]): string {
  if (period === "daily") {
    return "Diária";
  }

  if (period === "weekly") {
    return "Semanal";
  }

  return "Fixa";
}

function sortMissionsForDisplay(missions: MissionDto[]): MissionDto[] {
  return [...missions].sort((left, right) => {
    if (left.isSpecial !== right.isSpecial) {
      return left.isSpecial ? -1 : 1;
    }

    if (left.isClaimed !== right.isClaimed) {
      return left.isClaimed ? 1 : -1;
    }

    if (left.isCompleted !== right.isCompleted) {
      return left.isCompleted ? -1 : 1;
    }

    const leftPercent = left.targetValue <= 0 ? 0 : left.progressValue / left.targetValue;
    const rightPercent = right.targetValue <= 0 ? 0 : right.progressValue / right.targetValue;

    return rightPercent - leftPercent;
  });
}

function MissionList({
  missions,
  claimingMissionId,
  onClaim,
}: {
  missions: MissionDto[];
  claimingMissionId: string | null;
  onClaim: (missionId: string) => void;
}) {
  if (missions.length === 0) {
    return <Text type="secondary">Nenhuma missão nesta aba.</Text>;
  }

  return (
    <div className={styles.listWrap}>
      {sortMissionsForDisplay(missions).map((mission) => {
        const percent = mission.targetValue <= 0
          ? 0
          : Math.min(100, Math.round((mission.progressValue / mission.targetValue) * 100));
        const cardStateClass = mission.isClaimed
          ? styles.claimedMissionCard
          : mission.isCompleted
            ? styles.readyMissionCard
            : "";
        const claimLabel = mission.isClaimed
          ? "Resgatada"
          : mission.isCompleted
            ? "Resgatar agora"
            : "Reivindicar";

        return (
          <Card key={mission.id} size="small" className={`${styles.missionCard} ${cardStateClass} ${mission.isSpecial ? styles.specialMissionCard : ""}`}>
            <div className={styles.cardBody}>
              <Space direction="vertical" size={8} style={{ width: "100%" }} className={styles.mainInfo}>
                <Space align="center" wrap className={styles.titleRow}>
                  <Text strong className={styles.missionTitle}>{mission.title}</Text>
                  <Tag color="blue">{periodLabel(mission.period)}</Tag>
                  {mission.isSpecial ? <Tag color="magenta">Especial</Tag> : null}
                  {mission.isClaimed ? <Tag color="success">Concluída</Tag> : null}
                  {!mission.isClaimed && mission.isCompleted ? <Tag color="gold">Pronta para resgate</Tag> : null}
                </Space>

                <Text>{mission.description}</Text>
                <div className={styles.rewardChip}>
                  <Text type="secondary">Recompensa: {rewardLabel(mission)}</Text>
                </div>

                <div className={styles.progressBlock}>
                  <Progress percent={percent} showInfo={false} className={styles.progressBar} />
                  <div className={styles.progressMeta}>
                    <Text type="secondary">Progresso: {Math.min(mission.progressValue, mission.targetValue)}/{mission.targetValue}</Text>
                    <Text strong>{percent}%</Text>
                  </div>
                </div>
              </Space>

              <div className={styles.actionWrap}>
                <Button
                  type="primary"
                  disabled={!mission.isCompleted || mission.isClaimed}
                  loading={claimingMissionId === mission.id}
                  onClick={() => onClaim(mission.id)}
                  className={styles.claimButton}
                >
                  {claimLabel}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function MissionsView({
  userName,
  userNickName,
  userImageUrl,
  userRole,
  coins,
  diamonds,
  level,
}: MissionsViewProps) {
  const [apiMessage, messageContextHolder] = message.useMessage();
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [displayDiamonds, setDisplayDiamonds] = useState(diamonds);
  const [loading, setLoading] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [rewardModal, setRewardModal] = useState<MissionRewardModalState | null>(null);
  const [missionsByLevel, setMissionsByLevel] = useState<{
    iniciante: MissionDto[];
    intermediario: MissionDto[];
    avancado: MissionDto[];
  }>({
    iniciante: [],
    intermediario: [],
    avancado: [],
  });
  const [completedMissions, setCompletedMissions] = useState<MissionDto[]>([]);

  useEffect(() => {
    setDisplayCoins(coins);
  }, [coins]);

  useEffect(() => {
    setDisplayDiamonds(diamonds);
  }, [diamonds]);

  const loadMissions = useCallback(async () => {
    setLoading(true);

    try {
      const overview = await MissionsService.getOverview();

      setMissionsByLevel(overview.byLevel);
      setCompletedMissions(overview.completed);
    } catch (error) {
      apiMessage.error(error instanceof Error ? error.message : "Erro ao carregar missões.");
    } finally {
      setLoading(false);
    }
  }, [apiMessage]);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  const handleClaimMission = useCallback(async (missionId: string) => {
    setClaimingMissionId(missionId);

    try {
      const payload = await MissionsService.claimMission(missionId);
      const mission = payload.mission;
      const wallet = payload.wallet;

      if (!mission || !wallet) {
        throw new Error("Não foi possível resgatar a missão.");
      }

      let awardedImageUrl = payload.awardedCard?.cardImageUrl ?? null;

      if (!awardedImageUrl && payload.awardedCard?.cardId && payload.awardedCard.cardType) {
        awardedImageUrl = await resolveCardImageUrl({
          cardType: payload.awardedCard.cardType,
          cardId: payload.awardedCard.cardId,
          initialImageUrl: awardedImageUrl,
        });
      }

      const missionCardType = payload.awardedCard?.cardType ?? mission.reward.cardType;
      const missionCardRarity = payload.awardedCard?.rarity ?? mission.reward.cardRarity;

      setRewardModal({
        missionTitle: mission.title,
        coins: mission.reward.coins,
        diamonds: mission.reward.diamonds,
        xp: mission.reward.xp,
        card: missionCardType && missionCardRarity
          ? {
            cardType: getCardTypeLabel(missionCardType),
            cardName: payload.awardedCard?.cardName ?? null,
            rarity: getCardRarityLabel(missionCardRarity),
            imageUrl: awardedImageUrl,
          }
          : null,
      });

      setDisplayCoins(wallet.coins);
      setDisplayDiamonds(wallet.diamonds);
      apiMessage.success(payload.message ?? "Missão resgatada com sucesso.");
      await loadMissions();
    } catch (error) {
      apiMessage.error(error instanceof Error ? error.message : "Erro ao resgatar missão.");
    } finally {
      setClaimingMissionId(null);
    }
  }, [apiMessage, loadMissions]);

  const tabItems = useMemo(() => ([
    {
      key: "iniciante",
      label: `Iniciante (${missionsByLevel.iniciante.length})`,
      children: <MissionList missions={missionsByLevel.iniciante} claimingMissionId={claimingMissionId} onClaim={handleClaimMission} />,
    },
    {
      key: "intermediario",
      label: `Intermediário (${missionsByLevel.intermediario.length})`,
      children: <MissionList missions={missionsByLevel.intermediario} claimingMissionId={claimingMissionId} onClaim={handleClaimMission} />,
    },
    {
      key: "avancado",
      label: `Avançado (${missionsByLevel.avancado.length})`,
      children: <MissionList missions={missionsByLevel.avancado} claimingMissionId={claimingMissionId} onClaim={handleClaimMission} />,
    },
    {
      key: "concluidas",
      label: `Concluídas (${completedMissions.length})`,
      children: <MissionList missions={completedMissions} claimingMissionId={claimingMissionId} onClaim={handleClaimMission} />,
    },
  ]), [missionsByLevel, completedMissions, claimingMissionId, handleClaimMission]);

  const readyToClaimCount = useMemo(
    () => [...missionsByLevel.iniciante, ...missionsByLevel.intermediario, ...missionsByLevel.avancado]
      .filter((mission) => mission.isCompleted && !mission.isClaimed).length,
    [missionsByLevel],
  );

  const specialMissionsCount = useMemo(
    () => [...missionsByLevel.iniciante, ...missionsByLevel.intermediario, ...missionsByLevel.avancado]
      .filter((mission) => mission.isSpecial).length,
    [missionsByLevel],
  );

  return (
    <PlayerShell
      selectedKey="missions"
      userName={userName}
      userNickName={userNickName}
      userImageUrl={userImageUrl}
      userRole={userRole}
      coins={displayCoins}
      diamonds={displayDiamonds}
      level={level}
    >
      {messageContextHolder}
      <Card className={styles.rootCard} loading={loading}>
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <div className={styles.headerPanel}>
            <div>
              <Title level={3} style={{ margin: 0 }} className={styles.pageTitle}>Missões</Title>
              <Text type="secondary" className={styles.pageSubtitle}>Evolua completando missões por nível e resgate recompensas com XP.</Text>
            </div>
            <Space>
              <Button type="default" href="/battle?source=challenges&format=3x3">Iniciar batalha de desafio</Button>
              <div className={styles.levelBadge}>Nível {level}</div>
            </Space>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <Text type="secondary" className={styles.summaryLabel}>Prontas</Text>
              <Title level={4} style={{ margin: 0 }} className={styles.summaryValue}>{readyToClaimCount}</Title>
            </div>
            <div className={styles.summaryItem}>
              <Text type="secondary" className={styles.summaryLabel}>Concluídas</Text>
              <Title level={4} style={{ margin: 0 }} className={styles.summaryValue}>{completedMissions.length}</Title>
            </div>
            <div className={styles.summaryItem}>
              <Text type="secondary" className={styles.summaryLabel}>Especiais</Text>
              <Title level={4} style={{ margin: 0 }} className={styles.summaryValue}>{specialMissionsCount}</Title>
            </div>
          </div>

          <Tabs items={tabItems} className={styles.missionsTabs} />
        </Space>
      </Card>

      <RewardModal
        open={Boolean(rewardModal)}
        reward={rewardModal}
        onClose={() => setRewardModal(null)}
        fallbackImage={REWARD_CARD_FALLBACK_IMAGE}
      />
    </PlayerShell>
  );
}
