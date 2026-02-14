"use client";

import {
    SettingOutlined,
    DollarCircleOutlined,
    StarOutlined,
    LogoutOutlined,
    GoogleOutlined,
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Card,
    Col,
    Layout,
    Row,
    Space,
    Statistic,
    Tag,
    Typography,
} from "antd";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import styles from "@/app/page.module.css";

type HomeViewProps = {
    isAuthenticated: boolean;
    userName: string | null;
    userImageUrl: string | null;
    userRole: "user" | "admin";
    coins: number;
    diamonds: number;
};

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export function HomeView({
    isAuthenticated,
    userName,
    userImageUrl,
    userRole,
    coins,
    diamonds,
}: HomeViewProps) {
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
        <Layout className={styles.appLayout}>
            <Header className={styles.navbar}>
                <div className={styles.brand}>Chaotic Game</div>
                <Space size={12} align="center">
                    <Tag className={styles.resourceTag} icon={<DollarCircleOutlined />}>
                        {coins} moedas
                    </Tag>
                    <Tag className={styles.resourceTag} icon={<StarOutlined />}>
                        {diamonds} diamantes
                    </Tag>
                    <Avatar src={userImageUrl ?? undefined}>
                        {userName?.charAt(0)?.toUpperCase() ?? "U"}
                    </Avatar>
                    <Text className={styles.userName}>{userName ?? "Jogador"}</Text>
                    {userRole === "admin" ? (
                        <Link href="/admin/permissions">
                            <Button icon={<SettingOutlined />}>Configurações</Button>
                        </Link>
                    ) : null}
                    <Button
                        icon={<LogoutOutlined />}
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        Sair
                    </Button>
                </Space>
            </Header>

            <Content className={styles.content}>
                <Card className={styles.heroCard}>
                    <Title level={2}>Mundo Chaotic</Title>
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
                    </Row>
                </Card>
            </Content>
        </Layout>
    );
}
