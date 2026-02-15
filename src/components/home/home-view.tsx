"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    GoogleOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    Progress,
    Row,
    Space,
    Statistic,
    Tag,
    Typography,
    message,
} from "antd";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import styles from "@/app/page.module.css";
import { PlayerShell } from "@/components/player/player-shell";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { CREATURE_TRIBE_OPTIONS } from "@/dto/creature";
import type {
    StarterSelectableTribe,
} from "@/dto/progression";
import { isValidStarterSelectableTribe } from "@/dto/progression";
import { StarterProgressionService } from "@/lib/api/service";

type HomeViewProps = {
    isAuthenticated: boolean;
    userName: string | null;
    userNickName: string | null;
    userImageUrl: string | null;
    userRole: "user" | "admin";
    coins: number;
    diamonds: number;
    level: number;
    xpTotal: number;
    xpCurrentLevel: number;
    xpNextLevel: number;
};

const { Title, Paragraph, Text } = Typography;

const STARTER_TRIBE_SYMBOLS: Record<StarterSelectableTribe, string> = {
    overworld: "/assets/symbols/overWorld.png",
    underworld: "/assets/symbols/underWorld.png",
    mipedian: "/assets/symbols/mipedian.png",
    danian: "/assets/symbols/danian.png",
};

export function HomeView({
    isAuthenticated,
    userName,
    userNickName,
    userImageUrl,
    userRole,
    coins,
    diamonds,
    level,
    xpTotal,
    xpCurrentLevel,
    xpNextLevel,
}: HomeViewProps) {
    const [loadingStarterStatus, setLoadingStarterStatus] = useState(false);
    const [requiresStarterChoice, setRequiresStarterChoice] = useState(false);
    const [starterSelection, setStarterSelection] = useState<StarterSelectableTribe | null>(null);
    const [lockedStarterTribe, setLockedStarterTribe] = useState<StarterSelectableTribe | null>(null);
    const [submittingStarterChoice, setSubmittingStarterChoice] = useState(false);

    const starterTribes = useMemo(() => CREATURE_TRIBE_OPTIONS
        .filter((option): option is typeof option & { value: StarterSelectableTribe } => isValidStarterSelectableTribe(option.value)), []);

    const loadStarterStatus = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }

        setLoadingStarterStatus(true);

        try {
            const payload = await StarterProgressionService.getStarterStatus();

            setRequiresStarterChoice(payload.requiresChoice);

            const selectedStarterTribe = payload.selectedTribe && isValidStarterSelectableTribe(payload.selectedTribe)
                ? payload.selectedTribe
                : null;

            setLockedStarterTribe(selectedStarterTribe);
            setStarterSelection(selectedStarterTribe);

            if (!payload.requiresChoice) {
                setStarterSelection(null);
                setLockedStarterTribe(null);
            }
        } catch {
            message.error("Falha ao consultar status da escolha inicial de tribo.");
        } finally {
            setLoadingStarterStatus(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        void loadStarterStatus();
    }, [loadStarterStatus]);

    const handleConfirmStarterTribe = useCallback(async () => {
        if (!starterSelection) {
            message.warning("Selecione uma tribo para continuar.");
            return;
        }

        setSubmittingStarterChoice(true);

        try {
            await StarterProgressionService.chooseStarterTribe(starterSelection);

            message.success("Tribo inicial definida e pacotes adicionados ao seu deck.");
            setRequiresStarterChoice(false);
            window.location.reload();
        } catch {
            message.error("Falha ao definir tribo inicial.");
        } finally {
            setSubmittingStarterChoice(false);
        }
    }, [starterSelection]);

    const xpPercent = xpNextLevel > 0
        ? Math.min(100, Math.round((xpCurrentLevel / xpNextLevel) * 100))
        : 0;

    if (!isAuthenticated) {
        return (
            <main className={styles.guestPage}>
                <Card className={styles.guestCard}>
                    <Space orientation="vertical" size={20}>
                        <Tag color="purple">Chaotic World</Tag>
                        <Title level={2} className={styles.guestTitle}>
                            Bem-vindo ao Chaotic Game
                        </Title>
                        <Paragraph className={styles.guestText}>
                            Entre com sua conta Google para acessar sua base de jogador e
                            começar sua jornada no mundo caótico.
                        </Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            icon={<GoogleOutlined />}
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            block
                        >
                            Entrar com Google
                        </Button>
                    </Space>
                </Card>
            </main>
        );
    }

    return (
        <PlayerShell
            selectedKey="home"
            userName={userName}
            userNickName={userNickName}
            userImageUrl={userImageUrl}
            coins={coins}
            diamonds={diamonds}
            userRole={userRole}
        >
            {loadingStarterStatus ? (
                <Card className={styles.heroCard}>
                    <Space>
                        <LoadingLogo />
                        <Text>Carregando configuração inicial...</Text>
                    </Space>
                </Card>
            ) : null}

            {requiresStarterChoice ? (
                <Card className={`${styles.heroCard} ${styles.starterCard}`}>
                    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                        <div className={styles.starterHeroHeader}>
                            <Space align="center" size={10}>
                                <Tag color="purple" className={styles.starterBadge}>Primeiro acesso</Tag>
                                <Tag color="blue">Missão de início</Tag>
                            </Space>
                            <Title level={2} className={styles.starterTitle}>
                                Escolha sua Tribo
                            </Title>
                            <Paragraph className={styles.starterSubtitle}>
                                Defina sua tribo para ativar o deck inicial, desbloquear bônus de XP e iniciar sua progressão competitiva.
                            </Paragraph>
                            <Text className={styles.starterPhase}>Fase 1/1 · Seleção de Tribo</Text>
                        </div>

                        <Text className={styles.starterSectionTitle}>Tribos Disponíveis</Text>
                        <Row gutter={[14, 14]}>
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
                                            <div className={styles.starterTribeImageWrap}>
                                                <Image
                                                    src={STARTER_TRIBE_SYMBOLS[tribe.value]}
                                                    alt={tribe.label}
                                                    width={96}
                                                    height={96}
                                                    className={styles.starterTribeImage}
                                                    unoptimized
                                                    style={{ backgroundColor: "transparent" }}
                                                />
                                            </div>
                                            <Text strong>{tribe.label}</Text>
                                            <Text type="secondary" className={styles.starterTribeDescription}>
                                                {tribe.description}
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
                            <Text type="secondary">
                                Sua tribo inicial já está definida. Confirme para receber o deck inicial.
                            </Text>
                        ) : null}

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
                    </Space>
                </Card>
            ) : null}

            {!requiresStarterChoice ? (
                <Card className={styles.heroCard}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
                        <Title level={2} style={{ margin: 0 }}>Mundo Chaotic</Title>
                        {userRole === "admin" ? (
                            <Link href="/admin/permissions">
                                <Button icon={<SettingOutlined />}>Administração</Button>
                            </Link>
                        ) : null}
                    </Space>
                    <Paragraph>
                        Sua conta está ativa e pronta para explorar o jogo. Em breve, você
                        poderá usar moedas e diamantes para evoluir sua experiência.
                    </Paragraph>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Card className={styles.statCard}>
                                <Statistic title="Moedas" value={coins} suffix="🪙" />
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className={styles.statCard}>
                                <Statistic title="Diamantes" value={diamonds} suffix="💎" />
                            </Card>
                        </Col>
                        <Col xs={24}>
                            <Card className={styles.statCard}>
                                <Space orientation="vertical" style={{ width: "100%" }} size={6}>
                                    <Statistic title="Nível" value={level} suffix={`(XP total: ${xpTotal})`} />
                                    <Text>
                                        XP no nível atual: {xpCurrentLevel}/{xpNextLevel}
                                    </Text>
                                    <Progress percent={xpPercent} />
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Card>
            ) : null}
        </PlayerShell>
    );
}
