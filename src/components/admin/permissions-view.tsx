"use client";

import { useCallback, useMemo, useState } from "react";
import { App as AntdApp, Avatar, Button, Card, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, SafetyOutlined } from "@ant-design/icons";
import Link from "next/link";
import { type UserPermissionDto, type UserRole } from "@/dto/user";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { PermissionsAdminService } from "@/lib/api/service";

type PermissionsViewProps = {
    users: UserPermissionDto[];
};

const { Title, Text } = Typography;

export function PermissionsView({ users }: PermissionsViewProps) {
    const { notification } = AntdApp.useApp();
    const [rows, setRows] = useState<UserPermissionDto[]>(users);
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

    const handleRoleChange = useCallback(async (userId: string, role: UserRole) => {
        setLoadingUserId(userId);

        try {
            await PermissionsAdminService.updateUserRole(userId, role);

            setRows((previousRows) =>
                previousRows.map((row) =>
                    row.id === userId
                        ? {
                            ...row,
                            role,
                        }
                        : row,
                ),
            );

            notification.success({ message: "Permissão atualizada com sucesso." });
        } catch (error) {
            notification.error({ message: error instanceof Error ? error.message : "Erro ao atualizar role." });
        } finally {
            setLoadingUserId(null);
        }
    }, [notification]);

    const columns = useMemo<ColumnsType<UserPermissionDto>>(
        () => [
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
                title: "Role atual",
                dataIndex: "role",
                key: "role",
                width: 140,
                render: (role: UserRole) => (
                    <Tag color={role === "admin" ? "purple" : "blue"}>{role}</Tag>
                ),
            },
            {
                title: "Alterar role",
                key: "changeRole",
                width: 180,
                render: (_, row) => (
                    <Select
                        value={row.role}
                        disabled={loadingUserId === row.id}
                        suffixIcon={loadingUserId === row.id ? <LoadingLogo /> : undefined}
                        onChange={(newRole: UserRole) => handleRoleChange(row.id, newRole)}
                        options={[
                            { value: "user", label: "user" },
                            { value: "admin", label: "admin" },
                        ]}
                        style={{ width: "100%" }}
                    />
                ),
            },
        ],
        [handleRoleChange, loadingUserId],
    );

    return (
        <AdminShell selectedKey="permissions">
            <Card style={{ maxWidth: 1080, margin: "0 auto", borderRadius: 16 }}>
                <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <SafetyOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Gestão de Permissões
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>

                    <Table<UserPermissionDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        pagination={{ pageSize: 8 }}
                    />
                </Space>
            </Card>
        </AdminShell>
    );
}
