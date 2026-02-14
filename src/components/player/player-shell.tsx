"use client";

import { DollarCircleOutlined, LogoutOutlined, SettingOutlined, ShopOutlined, HomeOutlined } from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useMemo } from "react";
import styles from "./player-shell.module.css";

type PlayerShellProps = {
    selectedKey: "home" | "store";
    userName: string | null;
    userImageUrl: string | null;
    coins: number;
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
    userRole,
    children,
}: PlayerShellProps) {
    const items = useMemo(() => {
        const baseItems = [
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
        ];

        if (userRole === "admin") {
            baseItems.push({
                key: "settings",
                icon: <SettingOutlined />,
                label: <Link href="/admin/permissions">Configurações</Link>,
            });
        }

        return baseItems;
    }, [userRole]);

    return (
        <Layout className={styles.layout}>
            <Sider width={180} breakpoint="lg" collapsedWidth={0} className={styles.sider}>
                <div className={styles.brand}>Chaotic Game</div>
                <Menu
                    className={styles.navMenu}
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={items}
                    style={{ background: "transparent", borderInlineEnd: 0 }}
                />
            </Sider>

            <Layout>
                <Header className={styles.header}>
                    <Space size={12} align="center" wrap>
                        <div className={`${styles.resourceTag} ${styles.resourceCoins}`}>
                            <DollarCircleOutlined />
                            <span className={styles.resourceValue}>{coins}</span>
                            <span className={styles.resourceLabel}>moedas</span>
                        </div>
                        <Avatar src={userImageUrl ?? undefined}>
                            {userName?.charAt(0)?.toUpperCase() ?? "U"}
                        </Avatar>
                        <Text className={styles.userName}>{userName ?? "Jogador"}</Text>
                        <Button className={styles.headerButton} icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: "/" })}>
                            Sair
                        </Button>
                    </Space>
                </Header>

                <Content className={styles.content}>{children}</Content>
            </Layout>
        </Layout>
    );
}
