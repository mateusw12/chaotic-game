"use client";

import { BookOutlined, EnvironmentOutlined, SafetyOutlined, SettingOutlined, ToolOutlined, ThunderboltOutlined, AimOutlined, DollarCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import { Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

type AdminShellProps = {
    selectedKey: string;
    children: React.ReactNode;
};

const { Sider, Content } = Layout;
const { Title } = Typography;

export function AdminShell({ selectedKey, children }: AdminShellProps) {
    const items = useMemo(
        () => [
            {
                key: "permissions",
                icon: <SafetyOutlined />,
                label: <Link href="/admin/permissions">Permissões</Link>,
            },
            {
                key: "wallets",
                icon: <DollarCircleOutlined />,
                label: <Link href="/admin/wallets">Carteiras</Link>,
            },
            {
                key: "creatures",
                icon: <BookOutlined />,
                label: <Link href="/admin/creatures">Cadastro de Criaturas</Link>,
            },
            {
                key: "abilities",
                icon: <SettingOutlined />,
                label: <Link href="/admin/abilities">Cadastro de Habilidades</Link>,
            },
            {
                key: "locations",
                icon: <EnvironmentOutlined />,
                label: <Link href="/admin/locations">Cadastro de Locais</Link>,
            },
            {
                key: "battlegear",
                icon: <ToolOutlined />,
                label: <Link href="/admin/battlegear">Cadastro de Equipamentos</Link>,
            },
            {
                key: "mugic",
                icon: <ThunderboltOutlined />,
                label: <Link href="/admin/mugic">Cadastro de Mugic</Link>,
            },
            {
                key: "attacks",
                icon: <AimOutlined />,
                label: <Link href="/admin/attacks">Cadastro de Ataques</Link>,
            },
            {
                key: "tournaments",
                icon: <TrophyOutlined />,
                label: <Link href="/admin/tournaments">Cadastro de Torneios</Link>,
            },
        ],
        [],
    );

    return (
        <Layout style={{ minHeight: "100vh", background: "#060914" }}>
            <Sider
                width={220}
                breakpoint="lg"
                collapsedWidth={0}
                style={{ background: "#070b18", borderRight: "1px solid rgba(255,255,255,0.08)" }}
            >
                <div style={{ padding: "20px 16px 14px" }}>
                    <Title level={4} style={{ color: "#f4f6ff", margin: 0 }}>
                        Admin Chaotic
                    </Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={items}
                    style={{ background: "transparent", borderInlineEnd: 0 }}
                />
            </Sider>
            <Content style={{ padding: 24 }}>{children}</Content>
        </Layout>
    );
}
