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
    },
    {
        id: 2,
        tier: "Liga 2 · Prata",
        name: "Shadow Trials",
        boss: "Umbraxis",
        objective: "Evoluir consistência tática e gestão de recursos.",
        rewardFocus: "Cartas incomuns + diamantes menores.",
        rewardHighlights: ["Cartas incomuns", "Diamantes", "Bônus de etapa"],
    },
    {
        id: 3,
        tier: "Liga 3 · Ouro",
        name: "Elemental Apex",
        boss: "Maelstryx",
        objective: "Forçar adaptação estratégica entre elementos e ritmos.",
        rewardFocus: "Cartas raras e progressão estratégica.",
        rewardHighlights: ["Cartas raras", "XP elevado", "Recompensa de consistência"],
    },
    {
        id: 4,
        tier: "Liga 4 · Platina",
        name: "Crystal Dominion",
        boss: "Cryovex",
        objective: "Dominar partidas com restrições avançadas.",
        rewardFocus: "Raras + ultra raras situacionais.",
        rewardHighlights: ["Raras avançadas", "Chance ultra rara", "Bônus tático"],
    },
    {
        id: 5,
        tier: "Liga 5 · Diamante",
        name: "Titan Arena",
        boss: "Titanor",
        objective: "Operar combos sob alta pressão de tempo e recursos.",
        rewardFocus: "Pacotes premium e cartas raras.",
        rewardHighlights: ["Pacote premium", "Cartas raras", "Bônus de elite"],
    },
    {
        id: 6,
        tier: "Liga 6 · Esmeralda",
        name: "Chaos Citadel",
        boss: "Codarion",
        objective: "Atingir consistência de performance em cenários limite.",
        rewardFocus: "Recompensas altas e exclusivas por modo.",
        rewardHighlights: ["Recompensa exclusiva", "Super/ultra raras", "Multiplicador de bônus"],
    },
    {
        id: 7,
        tier: "Liga 7 · Mítica",
        name: "Pantheon of Champions",
        boss: "Apexion",
        objective: "Concluir a jornada competitiva máxima do modo.",
        rewardFocus: "Ultra raras/promo e bônus máximos.",
        rewardHighlights: ["Carta promo", "Ultra rara garantida", "Bônus máximo"],
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
        7: styles.themeMythic,
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
                        <Space size={8} wrap>
                            <Tag color="purple">Novo modo PvE</Tag>
                            <Tag color="cyan">7 ligas progressivas</Tag>
                            <Tag color="gold">Chefões únicos</Tag>
                        </Space>
                        <Title level={3} style={{ margin: 0 }}>Codex Trials</Title>
                        <Paragraph className={styles.heroText}>
                            Evolua de Bronze até Mítica enfrentando IAs cada vez mais estratégicas. Cada liga possui
                            regras próprias, estrelas de desempenho e um chefão temático.
                        </Paragraph>
                        <Row gutter={[10, 10]}>
                            <Col xs={24} md={8}>
                                <div className={styles.flowStep}><strong>1.</strong> Vença batalhas de fase contra IA</div>
                            </Col>
                            <Col xs={24} md={8}>
                                <div className={styles.flowStep}><strong>2.</strong> Derrote o chefão da liga</div>
                            </Col>
                            <Col xs={24} md={8}>
                                <div className={styles.flowStep}><strong>3.</strong> Suba de liga e ganhe recompensas</div>
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
                                            <div className={styles.flowNode}>{league.id}</div>
                                            <Card className={styles.leagueCard}>
                                                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                                    <div className={styles.leagueTop}>
                                                        <div className={styles.leagueHeaderRow}>
                                                            <Tag color="blue">{league.tier}</Tag>
                                                            <Tag color="purple">Boss: {league.boss}</Tag>
                                                        </div>
                                                        <Title level={4} style={{ margin: 0 }}>{league.name}</Title>
                                                        <div className={styles.placeholderRow}>
                                                            <div className={styles.placeholderImage}>
                                                                Símbolo da liga
                                                                <br />
                                                                /assets/codex-trials/symbols/{league.name.toLowerCase().replace(/\s+/g, "-")}.png
                                                            </div>
                                                            <div className={styles.placeholderImage}>
                                                                Avatar do chefão
                                                                <br />
                                                                /assets/codex-trials/boss/{league.boss.toLowerCase()}.png
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={styles.leagueMeta}>
                                                        <Text><strong>Chefão:</strong> {league.boss}</Text>
                                                        <Text><strong>Objetivo:</strong> {league.objective}</Text>
                                                    </div>

                                                    <div className={styles.progressPanel}>
                                                        <div className={styles.progressHeader}>
                                                            <Text className={styles.progressTitle}>Progresso da Liga</Text>
                                                            <Tag className={styles.progressTag}>{leagueRuntime.label}</Tag>
                                                        </div>
                                                        <Progress percent={leagueRuntime.percent} showInfo={false} strokeColor="var(--league-accent)" trailColor="rgba(255,255,255,0.08)" />
                                                        <Text className={styles.progressCaption}>{leagueRuntime.percent}% concluído</Text>
                                                    </div>

                                                    <div className={styles.deckPreview}>
                                                        <Text className={styles.deckPreviewLabel}>Arte temática do deck da liga</Text>
                                                        <div className={styles.deckPreviewImage}>
                                                            /assets/codex-trials/decks/{league.name.toLowerCase().replace(/\s+/g, "-")}.png
                                                        </div>
                                                    </div>

                                                    <div className={styles.rewardPanel}>
                                                        <div className={styles.rewardHeader}>
                                                            <Text className={styles.rewardTitle}>Recompensas da Liga</Text>
                                                            <Tag className={styles.rewardHeaderTag}>Premium Track</Tag>
                                                        </div>
                                                        <div className={styles.rewardFocusBadge}>
                                                            <Text className={styles.rewardFocusLine}>{league.rewardFocus}</Text>
                                                        </div>
                                                        <div className={styles.rewardGrid}>
                                                            {league.rewardHighlights.map((reward) => (
                                                                <div key={reward} className={styles.rewardItem}>
                                                                    <span className={styles.rewardItemDot}>◆</span>
                                                                    <Text className={styles.rewardItemText}>{reward}</Text>
                                                                </div>
                                                            ))}
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
