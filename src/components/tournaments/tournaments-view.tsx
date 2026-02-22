"use client";

import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from "antd";
import Image from "next/image";
import { PlayerShell } from "@/components/player/player-shell";
import type { TournamentDto } from "@/dto/tournament";
import styles from "./tournaments-view.module.css";

const { Title, Paragraph, Text } = Typography;

type TournamentsViewProps = {
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
  tournaments: TournamentDto[];
};

function scheduleLabel(tournament: TournamentDto): string {
  if (tournament.scheduleType === "date_range") {
    const startLabel = tournament.startAt ? new Date(tournament.startAt).toLocaleString("pt-BR") : "-";
    const endLabel = tournament.endAt ? new Date(tournament.endAt).toLocaleString("pt-BR") : "-";
    return `${startLabel} até ${endLabel}`;
  }

  return `Recorrente a cada ${tournament.periodDays ?? "-"} dias`;
}

export function TournamentsView({
  userName,
  userNickName,
  userImageUrl,
  userRole,
  coins,
  diamonds,
  tournaments,
}: TournamentsViewProps) {
  return (
    <PlayerShell
      selectedKey="tournaments"
      userName={userName}
      userNickName={userNickName}
      userImageUrl={userImageUrl}
      userRole={userRole}
      coins={coins}
      diamonds={diamonds}
    >
      <Space orientation="vertical" size={12} style={{ width: "100%" }}>
        <Title level={3} style={{ marginTop: 0 }}>Torneios</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Dispute torneios contra IA com regras customizadas. Novos eventos podem surgir por período fixo ou recorrência.
        </Paragraph>

        {tournaments.length === 0 ? (
          <Card className={styles.card}>
            <Empty description="Nenhum torneio disponível neste momento." />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {tournaments.map((tournament) => (
              <Col key={tournament.id} xs={24} lg={12}>
                <Card className={styles.card}>
                  <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                    {tournament.coverImageUrl ? (
                      <Image
                        src={tournament.coverImageUrl}
                        alt={tournament.name}
                        width={640}
                        height={360}
                        className={styles.cover}
                      />
                    ) : (
                      <div className={styles.coverFallback}>Sem capa</div>
                    )}

                    <Space wrap>
                      <Tag color="blue">{tournament.cardsCount} cartas</Tag>
                      <Tag color="purple">{tournament.playersCount} jogadores</Tag>
                      <Tag color="gold">{tournament.allowedFormats.join(", ")}</Tag>
                    </Space>

                    <Title level={4} style={{ margin: 0 }}>{tournament.name}</Title>

                    <Text className={styles.ruleLine}>Agendamento: {scheduleLabel(tournament)}</Text>
                    <Text className={styles.ruleLine}>Decks IA: {tournament.deckArchetypes.length ? tournament.deckArchetypes.join(", ") : "mistos"}</Text>
                    <Text className={styles.ruleLine}>Tribos: {tournament.allowedTribes.length ? tournament.allowedTribes.join(", ") : "todas"}</Text>
                    <Text className={styles.ruleLine}>Mugics: {tournament.allowMugic ? "permitidas" : "não permitidas"}</Text>
                    <Text className={styles.ruleLine}>Locais: {tournament.locationMode === "random" ? "aleatórios" : tournament.definedLocations.join(", ")}</Text>
                    {tournament.maxCardEnergy !== null ? (
                      <Text className={styles.ruleLine}>Energia máxima por carta: {tournament.maxCardEnergy}</Text>
                    ) : null}
                    {tournament.additionalRules ? (
                      <Text className={styles.ruleLine}>Regras extras: {tournament.additionalRules}</Text>
                    ) : null}

                    <Button block type="primary" disabled>
                      Em breve: Entrar no torneio
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </PlayerShell>
  );
}
