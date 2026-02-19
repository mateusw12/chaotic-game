"use client";

import { useMemo, useState } from "react";
import { App as AntdApp, Avatar, Button, Card, InputNumber, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, DollarCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { AdminUserWalletDto } from "@/dto/wallet";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { WalletsAdminService } from "@/lib/api/service";

type WalletsAdminViewProps = {
  wallets: AdminUserWalletDto[];
};

type CreditState = {
  coins: number;
  diamonds: number;
};

const { Title, Text } = Typography;

export function WalletsAdminView({ wallets }: WalletsAdminViewProps) {
  const { notification } = AntdApp.useApp();
  const [rows, setRows] = useState<AdminUserWalletDto[]>(wallets);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [credits, setCredits] = useState<Record<string, CreditState>>(() => {
    const initial: Record<string, CreditState> = {};

    for (const item of wallets) {
      initial[item.userId] = {
        coins: 0,
        diamonds: 0,
      };
    }

    return initial;
  });

  const columns = useMemo<ColumnsType<AdminUserWalletDto>>(() => [
    {
      title: "Usuário",
      dataIndex: "name",
      key: "name",
      render: (_, row) => (
        <Space>
          <Avatar src={row.imageUrl ?? undefined}>
            {row.name?.charAt(0)?.toUpperCase() ?? "U"}
          </Avatar>
          <Space orientation="vertical" size={0}>
            <Text strong>{row.name ?? "Sem nome"}</Text>
            <Text type="secondary">{row.email}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Saldo atual",
      key: "balance",
      width: 230,
      render: (_, row) => (
        <Space>
          <Tag color="gold">🪙 {row.coins}</Tag>
          <Tag color="geekblue">💎 {row.diamonds}</Tag>
        </Space>
      ),
    },
    {
      title: "Adicionar moedas",
      key: "coins",
      width: 180,
      render: (_, row) => (
        <InputNumber
          min={0}
          precision={0}
          value={credits[row.userId]?.coins ?? 0}
          onChange={(value) => {
            setCredits((previous) => ({
              ...previous,
              [row.userId]: {
                coins: Math.max(0, Math.trunc(Number(value ?? 0))),
                diamonds: previous[row.userId]?.diamonds ?? 0,
              },
            }));
          }}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Adicionar diamantes",
      key: "diamonds",
      width: 190,
      render: (_, row) => (
        <InputNumber
          min={0}
          precision={0}
          value={credits[row.userId]?.diamonds ?? 0}
          onChange={(value) => {
            setCredits((previous) => ({
              ...previous,
              [row.userId]: {
                coins: previous[row.userId]?.coins ?? 0,
                diamonds: Math.max(0, Math.trunc(Number(value ?? 0))),
              },
            }));
          }}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Ação",
      key: "action",
      width: 150,
      render: (_, row) => (
        <Button
          type="primary"
          icon={loadingUserId === row.userId ? <LoadingLogo /> : undefined}
          disabled={loadingUserId === row.userId}
          onClick={async () => {
            const coins = Math.max(0, Math.trunc(credits[row.userId]?.coins ?? 0));
            const diamonds = Math.max(0, Math.trunc(credits[row.userId]?.diamonds ?? 0));

            if (coins === 0 && diamonds === 0) {
              notification.warning({ message: "Informe moedas ou diamantes maiores que zero." });
              return;
            }

            setLoadingUserId(row.userId);

            try {
              const wallet = await WalletsAdminService.credit({
                userId: row.userId,
                coins,
                diamonds,
              });

              setRows((previous) => previous.map((item) => (
                item.userId === row.userId
                  ? {
                    ...item,
                    coins: wallet.coins,
                    diamonds: wallet.diamonds,
                  }
                  : item
              )));

              setCredits((previous) => ({
                ...previous,
                [row.userId]: {
                  coins: 0,
                  diamonds: 0,
                },
              }));

              notification.success({ message: "Saldo creditado com sucesso." });
            } catch (error) {
              notification.error({ message: error instanceof Error ? error.message : "Erro ao creditar saldo." });
            } finally {
              setLoadingUserId(null);
            }
          }}
          block
        >
          Creditar
        </Button>
      ),
    },
  ], [credits, loadingUserId, notification]);

  return (
    <AdminShell selectedKey="wallets">
      <Card style={{ maxWidth: 1240, margin: "0 auto", borderRadius: 16 }}>
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <DollarCircleOutlined />
              <Title level={3} style={{ margin: 0 }}>
                Gestão de Moedas e Diamantes
              </Title>
            </Space>

            <Link href="/admin/permissions">
              <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
            </Link>
          </Space>

          <Table<AdminUserWalletDto>
            rowKey="userId"
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>
    </AdminShell>
  );
}
