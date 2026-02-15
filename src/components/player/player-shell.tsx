"use client";

import { DollarCircleOutlined, LogoutOutlined, ProfileOutlined, SettingOutlined, ShopOutlined, HomeOutlined, StarOutlined, TrophyOutlined, AppstoreOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from "antd";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useMemo } from "react";
import { useDisplayUserName } from "@/hooks/use-display-user-name";
import styles from "./player-shell.module.css";

type PlayerShellProps = {
    selectedKey: "home" | "decks" | "store" | "codex-trials" | "tournaments";
    userName: string | null;
    userNickName: string | null;
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
    userNickName,
    userImageUrl,
    coins,
    diamonds,
    userRole,
    children,
}: PlayerShellProps) {
    const displayUserName = useDisplayUserName({ name: userName, nickName: userNickName });

    const items = useMemo(() => {
        const baseItems = [
            {
                key: "home",
                icon: <HomeOutlined />,
                label: <Link href="/">Início</Link>,
            },
            {
                key: "decks",
                icon: <AppstoreOutlined />,
                label: <Link href="/decks">Decks</Link>,
            },
            {
                key: "store",
                icon: <ShopOutlined />,
                label: <Link href="/store">Loja</Link>,
            },
            {
                key: "codex-trials",
                icon: <TrophyOutlined />,
                label: <Link href="/codex-trials">Codex Trials</Link>,
            },
            {
                key: "tournaments",
                icon: <TrophyOutlined />,
                label: <Link href="/tournaments">Torneios</Link>,
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

    const profileMenuItems = useMemo(() => ([
        {
            key: "profile",
            icon: <ProfileOutlined />,
            label: <Link href="/profile">Editar perfil</Link>,
        },
    ]), []);

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
                    <Space className={styles.headerRow} size={12} align="center" wrap>
                        <div className={`${styles.resourceTag} ${styles.resourceCoins}`}>
                            <DollarCircleOutlined />
                            <span className={styles.resourceValue}>{coins}</span>
                            <span className={styles.resourceLabel}>moedas</span>
                        </div>
                        <div className={`${styles.resourceTag} ${styles.resourceDiamonds}`}>
                            <StarOutlined />
                            <span className={styles.resourceValue}>{diamonds}</span>
                            <span className={styles.resourceLabel}>diamantes</span>
                        </div>
                        <Dropdown menu={{ items: profileMenuItems }} trigger={["click"]}>
                            <button type="button" className={styles.profileTrigger}>
                                <Avatar src={userImageUrl ?? undefined}>
                                    {displayUserName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Text className={styles.userName}>{displayUserName}</Text>
                            </button>
                        </Dropdown>
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
