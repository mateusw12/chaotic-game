"use client";

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
} from "antd";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "@/app/page.module.css";
import { PlayerShell } from "@/components/player/player-shell";

type HomeViewProps = {
    isAuthenticated: boolean;
    userName: string | null;
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

export function HomeView({
    isAuthenticated,
    userName,
    userImageUrl,
    userRole,
    coins,
    diamonds,
    level,
    xpTotal,
    xpCurrentLevel,
    xpNextLevel,
}: HomeViewProps) {
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
            userImageUrl={userImageUrl}
            coins={coins}
            diamonds={diamonds}
            userRole={userRole}
        >
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
        </PlayerShell>
    );
}
