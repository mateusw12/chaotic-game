"use client";

import { DollarCircleOutlined, LogoutOutlined, SettingOutlined, ShopOutlined, StarOutlined, HomeOutlined } from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useMemo } from "react";
import styles from "./player-shell.module.css";

type PlayerShellProps = {
    selectedKey: "home" | "store";
    userName: string | null;
    userImageUrl: string | null;
    coins: number;
    diamonds: number;
    userRole: "user" | "admin";
    children: React.ReactNode;
};

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export function PlayerShell({
    selectedKey,
    userName,
    userImageUrl,
    coins,
    diamonds,
    userRole,
    children,
}: PlayerShellProps) {
    const items = useMemo(() => ([
        {
            key: "home",
            icon: <HomeOutlined />,
            label: <Link href="/">Início</Link>,
        },
        {
            key: "store",
            icon: <ShopOutlined />,
            label: <Link href="/store">Loja</Link>,
        },
    ]), []);

    return (
        <Layout className={styles.layout}>
            <Sider width={180} breakpoint="lg" collapsedWidth={0} className={styles.sider}>
                <div className={styles.brand}>Chaotic Game</div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={items}
                    style={{ background: "transparent", borderInlineEnd: 0 }}
                />
            </Sider>

            <Layout>
                <Header className={styles.header}>
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
                        <Button icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: "/" })}>
                            Sair
                        </Button>
                    </Space>
                </Header>

                <Content className={styles.content}>{children}</Content>
            </Layout>
        </Layout>
    );
}
