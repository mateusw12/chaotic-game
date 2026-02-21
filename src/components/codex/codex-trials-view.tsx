"use client";

import { useState } from "react";
import { Card, Col, Divider, Row, Space, Tag, Typography, Button, Progress } from "antd";
import { Modal } from "antd";
import { PlayerShell } from "@/components/player/player-shell";
import styles from "./codex-trials-view.module.css";

type CodexTrialsViewProps = {
  userName: string | null;
  userNickName: string | null;
  userImageUrl: string | null;
  userRole: "user" | "admin";
  coins: number;
  diamonds: number;
};

type LeagueSpec = {
  id: number;
  tier: string;
  name: string;
  boss: string;
  objective: string;
  rewardFocus: string;
  rewardHighlights: string[];
  imgSymbol?: string;
  imgBoss?: string;
};

type LeagueRuntime = {
  isActive: boolean;
  status: "active" | "completed" | "locked";
  label: string;
  percent: number;
};

type BattleFormat = "1x1" | "3x3" | "5x5" | "7x7";

const { Title, Paragraph, Text } = Typography;

const LEAGUES: LeagueSpec[] = [
  {
    id: 1,
    tier: "Liga 1 · Bronze",
    name: "Rising Sparks",
    boss: "Ignitus",
    objective: "Consolidar fundamentos e leitura de jogo.",
    rewardFocus: "Cartas básicas + moedas.",
    rewardHighlights: ["Pacote base", "Moedas bônus", "Carta de progressão"],
    imgSymbol: "bronze.png",
    imgBoss: "boss_1.png"
  },
  {
    id: 2,
    tier: "Liga 2 · Prata",
    name: "Shadow Trials",
    boss: "Umbraxis",
    objective: "Evoluir consistência tática e gestão de recursos.",
    rewardFocus: "Cartas incomuns + diamantes menores.",
    rewardHighlights: ["Cartas incomuns", "Diamantes", "Bônus de etapa"],
    imgSymbol: "silver.png",
    imgBoss: "boss_2.png"
  },
  {
    id: 3,
    tier: "Liga 3 · Ouro",
    name: "Elemental Apex",
    boss: "Maelstryx",
    objective: "Forçar adaptação estratégica entre elementos e ritmos.",
    rewardFocus: "Cartas raras e progressão estratégica.",
    rewardHighlights: ["Cartas raras", "XP elevado", "Recompensa de consistência"],
    imgSymbol: "gold.png",
    imgBoss: "boss_3.png"
  },
  {
    id: 4,
    tier: "Liga 4 · Platina",
    name: "Crystal Dominion",
    boss: "Cryovex",
    objective: "Dominar partidas com restrições avançadas.",
    rewardFocus: "Raras + ultra raras situacionais.",
    rewardHighlights: ["Raras avançadas", "Chance ultra rara", "Bônus tático"],
    imgSymbol: "platinum.png",
    imgBoss: "boss_4.png"
  },
  {
    id: 5,
    tier: "Liga 5 · Diamante",
    name: "Titan Arena",
    boss: "Titanor",
    objective: "Operar combos sob alta pressão de tempo e recursos.",
    rewardFocus: "Pacotes premium e cartas raras.",
    rewardHighlights: ["Pacote premium", "Cartas raras", "Bônus de elite"],
    imgSymbol: "diamond.png",
    imgBoss: "boss_5.png"
  },
  {
    id: 6,
    tier: "Liga 6 · Esmeralda",
    name: "Chaos Citadel",
    boss: "Codarion",
    objective: "Atingir consistência de performance em cenários limite.",
    rewardFocus: "Recompensas altas e exclusivas por modo.",
    rewardHighlights: ["Recompensa exclusiva", "Super/ultra raras", "Multiplicador de bônus"],
    imgSymbol: "champion.png",
    imgBoss: "boss_6.png"
  },
  {
    id: 7,
    tier: "Liga 7 · Legend",
    name: "Pantheon of Champions",
    boss: "Apexion",
    objective: "Concluir a jornada competitiva máxima do modo.",
    rewardFocus: "Ultra raras/promo e bônus máximos.",
    rewardHighlights: ["Carta promo", "Ultra rara garantida", "Bônus máximo"],
    imgSymbol: "legend.png",
    imgBoss: "boss_7.png"
  },
];

const FORMAT_OPTIONS: Array<{ value: BattleFormat; label: string; description: string }> = [
  { value: "1x1", label: "Formato 1x1", description: "Partidas rápidas com foco em leitura tática." },
  { value: "3x3", label: "Formato 3x3", description: "Combinações intermediárias e sinergia de tribos." },
  { value: "5x5", label: "Formato 5x5", description: "Estratégias amplas com mais variações de turno." },
  { value: "7x7", label: "Formato 7x7", description: "Modo avançado com alto nível de complexidade." },
];

function getLeagueRuntime(leagueId: number, currentLeagueId: number, currentLeaguePercent: number): LeagueRuntime {
  if (leagueId < currentLeagueId) {
    return {
      isActive: false,
      status: "completed",
      label: "Concluída",
      percent: 100,
    };
  }

  if (leagueId === currentLeagueId) {
    return {
      isActive: true,
      status: "active",
      label: "Ativa",
      percent: Math.max(0, Math.min(100, currentLeaguePercent)),
    };
  }

  return {
    isActive: false,
    status: "locked",
    label: "Bloqueada",
    percent: 0,
  };
}

function getLeagueThemeClass(leagueId: number): string {
  const themeMap: Record<number, string> = {
    1: styles.themeBronze,
    2: styles.themeSilver,
    3: styles.themeGold,
    4: styles.themePlatinum,
    5: styles.themeDiamond,
    6: styles.themeEmerald,
    7: styles.themeLegend,
  };

  return themeMap[leagueId] ?? styles.themeBronze;
}

export function CodexTrialsView({
  userName,
  userNickName,
  userImageUrl,
  userRole,
  coins,
  diamonds,
}: CodexTrialsViewProps) {
  const currentLeagueId = 2;
  const currentLeagueProgressPercent = 24;
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<LeagueSpec | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat | null>(null);

  const handleStartLeague = (league: LeagueSpec) => {
    setSelectedLeague(league);
    setSelectedFormat(null);
    setIsDeckModalOpen(false);
    setIsFormatModalOpen(true);
  };

  const handleSelectFormat = (format: BattleFormat) => {
    setSelectedFormat(format);
    setIsFormatModalOpen(false);
    setIsDeckModalOpen(true);
  };

  return (
    <PlayerShell
      selectedKey="codex-trials"
      userName={userName}
      userNickName={userNickName}
      userImageUrl={userImageUrl}
      userRole={userRole}
      coins={coins}
      diamonds={diamonds}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card className={`${styles.sectionCard} ${styles.heroCard}`}>
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <div className={styles.heroHeader}>
              <div className={styles.heroCrest} aria-hidden />
              <div>
                <Title level={3} className={styles.heroTitle} style={{ margin: 0 }}>Codex Trials</Title>
                <Paragraph className={styles.heroText}>
                  Evolua de Bronze até Lendária enfrentando IAs cada vez mais estratégicas. Enfrente desafios únicos em cada liga, derrote chefões e conquiste recompensas épicas.
                </Paragraph>
              </div>
            </div>

            <Row gutter={[10, 10]}>
              <Col xs={24} md={8}>
                <div className={styles.flowStep}>
                  <div className={styles.stepIcon}>⚔️</div>
                  <div className={styles.stepText}><strong>1.</strong> Vença batalhas de fase contra IA</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className={styles.flowStep}>
                  <div className={styles.stepIcon}>🏆</div>
                  <div className={styles.stepText}><strong>2.</strong> Derrote o chefão da liga</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className={styles.flowStep}>
                  <div className={styles.stepIcon}>🚀</div>
                  <div className={styles.stepText}><strong>3.</strong> Suba de liga e ganhe recompensas</div>
                </div>
              </Col>
            </Row>
          </Space>
        </Card>

        <Card className={styles.sectionCard}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>Regras e Progressão</Title>
            <div className={styles.rulesList}>
              <Text>• Para subir de liga, o jogador precisa vencer as batalhas da liga atual.</Text>
              <Text>• Sistema de estrelas: 3★ (&gt;80% cartas sobreviventes), 2★ (&gt;50%), 1★ (&gt;25%).</Text>
              <Text>• 3★ representa vitória perfeita e gera recompensa máxima.</Text>
              <Text>• Recompensas por modo: 1x1 (básicas/moedas), 3x3 (incomuns/diamantes), 5x5 (raras/premium), 7x7 (super/ultra raras).</Text>
              <Text>• Cada chefão entrega recompensa especial (ultra rara/promo exclusiva).</Text>
            </div>
          </Space>
        </Card>

        <Divider style={{ margin: 0 }} />

        <Card className={`${styles.sectionCard} ${styles.flowCard}`}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>Rota de Ascensão</Title>
            <Paragraph style={{ margin: 0 }}>
              As ligas seguem uma trilha progressiva. Vença as fases, enfrente o chefão e avance para o próximo nível.
            </Paragraph>
            <div className={styles.flowTrack}>
              {LEAGUES.map((league, index) => (
                (() => {
                  const leagueRuntime = getLeagueRuntime(league.id, currentLeagueId, currentLeagueProgressPercent);

                  return (
                    <div
                      key={league.name}
                      className={`${styles.flowStepItem} ${index % 2 === 0 ? styles.flowLeft : styles.flowRight} ${getLeagueThemeClass(league.id)}`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className={styles.flowNode}>
                        <img
                          src={`/assets/ligas/symbols/${league.imgSymbol}`}
                          alt={`${league.name} symbol`}
                          className={styles.flowNodeSymbol}
                        />
                      </div>
                      <Card className={styles.leagueCard}>
                        <Space direction="vertical" size={10} style={{ width: "100%" }}>
                          <div className={styles.leagueTop}>
                            <div className={styles.leagueHeaderRow} />
                            <Title level={4} style={{ margin: 0 }}>{league.name}</Title>
                            <div className={styles.energyBar} aria-hidden>
                              <div className={styles.energyFill} style={{ width: `${leagueRuntime.percent}%` }} />
                            </div>

                            <div className={styles.bossBlock}>
                              <img
                                src={`/assets/ligas/boss/${league.imgBoss}`}
                                alt={`${league.boss} avatar`}
                                className={styles.bossAvatarSmall}
                              />
                              <div className={styles.bossCaption}>{league.boss}</div>
                            </div>

                            <div className={styles.leagueHUD}>
                              {leagueRuntime.percent > 0 && (
                                <div className={styles.powerPill}>Power <strong>{Math.round(leagueRuntime.percent)}</strong></div>
                              )}
                            </div>

                          </div>



                          {/* Progress removed — energy bar shows progress */}

                          <div className={styles.deckPreview}>
                            <div className={styles.deckPreviewImage}>
                              /assets/codex-trials/decks/{league.name.toLowerCase().replace(/\s+/g, "-")}.png
                            </div>
                          </div>

                          <div className={styles.rewardPanel}>
                            <div className={styles.rewardHeader}>
                              <Text className={styles.rewardTitle}>Recompensas da Liga</Text>
                            </div>
                            <div className={styles.rewardGrid}>
                              {league.rewardHighlights.map((reward) => {
                                const imgSlug = reward.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                                return (
                                  <div key={reward} className={styles.rewardItem}>
                                    <div className={styles.rewardImage}>
                                      <img
                                        src={`/assets/codex-trials/rewards/${imgSlug}.png`}
                                        alt={reward}
                                        className={styles.rewardImg}
                                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.12'; }}
                                      />
                                    </div>
                                    <div className={styles.rewardTextWrap}>
                                      <Text className={styles.rewardItemText}>{reward}</Text>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <Button block disabled={!leagueRuntime.isActive} onClick={() => handleStartLeague(league)}>
                            {leagueRuntime.isActive ? `Jogar ${league.name}` : "Liga indisponível"}
                          </Button>
                        </Space>
                      </Card>
                    </div>
                  );
                })()
              ))}
            </div>
          </Space>
        </Card>

        <Modal
          title={`Escolha o formato${selectedLeague ? ` · ${selectedLeague.name}` : ""}`}
          open={isFormatModalOpen}
          onCancel={() => setIsFormatModalOpen(false)}
          footer={null}
        >
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Text>Selecione o formato da batalha para iniciar esta liga.</Text>
            {FORMAT_OPTIONS.map((formatOption) => (
              <Button
                key={formatOption.value}
                block
                className={styles.formatButton}
                onClick={() => handleSelectFormat(formatOption.value)}
              >
                {formatOption.label}
              </Button>
            ))}
          </Space>
        </Modal>

        <Modal
          title="Escolha seu deck"
          open={isDeckModalOpen}
          onCancel={() => setIsDeckModalOpen(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setIsDeckModalOpen(false)}>
              Fechar
            </Button>,
          ]}
        >
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Text>
              <strong>Liga:</strong> {selectedLeague?.name ?? "-"}
            </Text>
            <Text>
              <strong>Formato escolhido:</strong> {selectedFormat ?? "-"}
            </Text>
            <Text className={styles.deckSelectionPlaceholder}>
              A seleção de deck será exibida aqui em breve.
            </Text>
          </Space>
        </Modal>
      </Space>
    </PlayerShell>
  );
}
