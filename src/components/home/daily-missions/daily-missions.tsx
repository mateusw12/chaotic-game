"use client";

import { useEffect, useState } from "react";
import { Card, Button, Progress, Space, Tag, Typography, notification } from "antd";
import Link from "next/link";
import type { GetMissionsResponseDto, MissionDto } from "@/dto/mission";
import styles from "@/app/page.module.css";

const { Text } = Typography;

function rewardLabel(mission: MissionDto): string {
  const chunks: string[] = [];
  chunks.push(`${mission.reward.coins} moedas`);
  chunks.push(`${mission.reward.diamonds} diamantes`);
  chunks.push(`${mission.reward.xp} XP`);

  if (mission.reward.cardRarity) {
    chunks.push(`1 carta ${mission.reward.cardRarity}`);
  }

  return chunks.join(" • ");
}

export default function DailyMissions() {
  const [missions, setMissions] = useState<MissionDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMissions = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/missions", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json() as GetMissionsResponseDto;

        if (!response.ok || !payload.success || !payload.overview) {
          throw new Error(payload.message ?? "Não foi possível carregar as missões.");
        }

        setMissions(payload.overview.active);
      } catch (error) {
        notification.error({
          message: error instanceof Error ? error.message : "Erro ao carregar missões da Home.",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadMissions();
  }, []);

  return (
    <Card
      className={styles.missionsCard}
      title="Missões"
      extra={(
        <Link href="/missions">
          <Button size="small" type="link" style={{ paddingInline: 0 }}>
            Ver todas
          </Button>
        </Link>
      )}
      loading={loading}
    >
      <div>
        {missions.map((mission) => {
          const percent = mission.targetValue <= 0
            ? 0
            : Math.min(100, Math.round((mission.progressValue / mission.targetValue) * 100));

          return (
            <div key={mission.id} className={styles.missionItem} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Space align="center" wrap>
                <div className={styles.missionTitle}>{mission.title}</div>
                <Tag color={mission.isCompleted ? "gold" : "blue"}>{mission.isCompleted ? "Pronta" : "Em progresso"}</Tag>
              </Space>

              <Progress percent={percent} showInfo={false} size="small" />

              <div className={styles.missionReward}>
                <Text type="secondary">{Math.min(mission.progressValue, mission.targetValue)}/{mission.targetValue}</Text>
                <Tag color="gold">{rewardLabel(mission)}</Tag>
              </div>
            </div>
          );
        })}

        {missions.length === 0 && !loading ? (
          <Text type="secondary">Nenhuma missão ativa no momento.</Text>
        ) : null}
      </div>
    </Card>
  );
}
