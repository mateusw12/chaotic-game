"use client";

import { Card, Col, Progress, Row, Space, Statistic, Typography } from "antd";
import { CREATURE_TRIBE_OPTIONS } from "@/dto/creature";
import styles from "../profile-view.module.css";
import { UserProgressionDto, UserProgressionOverviewDto, UserProgressionStatsDto } from "@/dto/progression";

const { Text } = Typography;

interface Props {
  progression?: UserProgressionDto | undefined;
  stats?: UserProgressionStatsDto | undefined;
  progressionOverview?: UserProgressionOverviewDto | null;
  xpPercent: number;
}

export default function ProfileStats({ progression, stats, progressionOverview, xpPercent }: Props) {
  return (
    <Card size="small" className={styles.statsCard}>
      <Space orientation="vertical" size={14} style={{ width: "100%" }}>
        <div>
          <Text className={styles.previewLabel}>Nível atual</Text>
          <div className={styles.levelLine}>
            <Text strong>Nível {progression?.level ?? 1}</Text>
            <Text type="secondary">XP {progression?.xpCurrentLevel ?? 0}/{progression?.xpNextLevel ?? 100}</Text>
          </div>
          <Progress percent={xpPercent} />
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Score" value={stats?.score ?? progression?.xpTotal ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Vitórias" value={stats?.victories ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Derrotas" value={stats?.defeats ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Total de cards" value={stats?.totalCards ?? progressionOverview?.inventory.reduce((sum: number, item: any) => sum + item.quantity, 0) ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Locais" value={stats?.locationCards ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Equipamentos" value={stats?.battlegearCards ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Statistic title="Ataques" value={stats?.attackCards ?? 0} />
            </Card>
          </Col>
        </Row>

        <div>
          <Text className={styles.previewLabel}>Cards por tribo</Text>
          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
            {CREATURE_TRIBE_OPTIONS.map((tribe) => (
              <Col key={tribe.value} xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic title={tribe.label} value={stats?.cardsByTribe?.[tribe.value] ?? 0} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Space>
    </Card>
  );
}
