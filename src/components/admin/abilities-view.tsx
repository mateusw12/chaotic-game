"use client";

import { useCallback, useMemo, useState } from "react";
import {
    App as AntdApp,
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
    ABILITY_CATEGORY_OPTIONS,
    ABILITY_EFFECT_TYPE_OPTIONS,
    ABILITY_STAT_OPTIONS,
    ABILITY_TARGET_SCOPE_OPTIONS,
    type AbilityCategory,
    type AbilityDto,
    type AbilityEffectType,
    type AbilityStat,
    type AbilityTargetScope,
    type CreateAbilityRequestDto,
} from "@/dto/ability";
import { AdminShell } from "@/components/admin/admin-shell";
import { AbilitiesAdminService } from "@/lib/api/service";

type AbilitiesViewProps = {
    abilities: AbilityDto[];
};

type AbilityFormValues = {
    name: string;
    category: AbilityCategory;
    effectType: AbilityEffectType;
    targetScope: AbilityTargetScope;
    stat: AbilityStat;
    value: number;
    description?: string;
};

const { Title, Text } = Typography;

export function AbilitiesView({ abilities }: AbilitiesViewProps) {
    const { message } = AntdApp.useApp();
    const [form] = Form.useForm<AbilityFormValues>();
    const [rows, setRows] = useState<AbilityDto[]>(abilities);
    const [isSaving, setIsSaving] = useState(false);
    const [editingAbilityId, setEditingAbilityId] = useState<string | null>(null);
    const [deletingAbilityId, setDeletingAbilityId] = useState<string | null>(null);

    async function onCreateAbility(values: AbilityFormValues) {
        setIsSaving(true);

        try {
            const payload: CreateAbilityRequestDto = {
                name: values.name,
                category: values.category,
                effectType: values.effectType,
                targetScope: values.targetScope,
                stat: values.stat,
                value: values.value,
                description: values.description ?? null,
            };

            const isEditing = Boolean(editingAbilityId);
            const ability = isEditing
                ? await AbilitiesAdminService.update(editingAbilityId as string, payload)
                : await AbilitiesAdminService.create(payload);

            if (isEditing) {
                setRows((previousRows) =>
                    previousRows.map((row) => (row.id === ability.id ? ability : row)),
                );
            } else {
                setRows((previous) => [ability, ...previous]);
            }

            setEditingAbilityId(null);
            form.resetFields();
            message.success(
                isEditing
                    ? "Habilidade atualizada com sucesso."
                    : "Habilidade cadastrada com sucesso.",
            );
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao salvar habilidade.");
        } finally {
            setIsSaving(false);
        }
    }

    const startEditAbility = useCallback((ability: AbilityDto) => {
        setEditingAbilityId(ability.id);
        form.setFieldsValue({
            name: ability.name,
            category: ability.category,
            effectType: ability.effectType,
            targetScope: ability.targetScope,
            stat: ability.stat,
            value: ability.value,
            description: ability.description ?? undefined,
        });
    }, [form]);

    function cancelEditAbility() {
        setEditingAbilityId(null);
        form.resetFields();
    }

    const onDeleteAbility = useCallback(async (abilityId: string) => {
        setDeletingAbilityId(abilityId);

        try {
            await AbilitiesAdminService.remove(abilityId);

            setRows((previousRows) => previousRows.filter((row) => row.id !== abilityId));
            message.success("Habilidade removida com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao remover habilidade.");
        } finally {
            setDeletingAbilityId(null);
        }
    }, [message]);

    const columns = useMemo<ColumnsType<AbilityDto>>(
        () => [
            {
                title: "Nome",
                dataIndex: "name",
                key: "name",
                render: (name: string) => <Text strong>{name}</Text>,
            },
            {
                title: "Categoria",
                dataIndex: "category",
                key: "category",
                width: 140,
                render: (category: AbilityCategory) => (
                    <Tag color={category === "support" ? "geekblue" : "magenta"}>{category}</Tag>
                ),
            },
            {
                title: "Efeito",
                key: "effect",
                width: 220,
                render: (_, row) => {
                    const effectLabel =
                        ABILITY_EFFECT_TYPE_OPTIONS.find((item) => item.value === row.effectType)?.label ??
                        row.effectType;
                    const targetScopeLabel =
                        ABILITY_TARGET_SCOPE_OPTIONS.find((item) => item.value === row.targetScope)?.label ??
                        row.targetScope;
                    const statLabel =
                        ABILITY_STAT_OPTIONS.find((item) => item.value === row.stat)?.label ?? row.stat;

                    return (
                        <Space orientation="vertical" size={4}>
                            <Tag color="purple">
                                {effectLabel} {row.value} em {statLabel}
                            </Tag>
                            <Tag color="cyan">Alvo: {targetScopeLabel}</Tag>
                        </Space>
                    );
                },
            },
            {
                title: "Descrição",
                dataIndex: "description",
                key: "description",
                render: (description: string | null) => description ?? "-",
            },
            {
                title: "Ações",
                key: "actions",
                width: 190,
                render: (_, row) => (
                    <Space>
                        <Button size="small" onClick={() => startEditAbility(row)}>
                            Editar
                        </Button>
                        <Popconfirm
                            title="Remover habilidade"
                            description="Essa ação não pode ser desfeita."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => onDeleteAbility(row.id)}
                        >
                            <Button
                                size="small"
                                danger
                                loading={deletingAbilityId === row.id}
                            >
                                Remover
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [deletingAbilityId, onDeleteAbility, startEditAbility],
    );

    return (
        <AdminShell selectedKey="abilities">
            <Space orientation="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <SettingOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Cadastro de Habilidades
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>
                </Card>

                <Card title="Nova habilidade" style={{ borderRadius: 16 }}>
                    <Form<AbilityFormValues>
                        form={form}
                        layout="vertical"
                        onFinish={onCreateAbility}
                        initialValues={{
                            value: 0,
                            targetScope: "all_creatures",
                        }}
                    >
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome." }]}>
                                <Input placeholder="Ex.: Outperform" />
                            </Form.Item>

                            <Space wrap size={12}>
                                <Form.Item label="Categoria" name="category" rules={[{ required: true, message: "Selecione categoria." }]}>
                                    <Select
                                        style={{ width: 220 }}
                                        options={ABILITY_CATEGORY_OPTIONS.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item label="Tipo de efeito" name="effectType" rules={[{ required: true, message: "Selecione efeito." }]}>
                                    <Select
                                        style={{ width: 220 }}
                                        options={ABILITY_EFFECT_TYPE_OPTIONS.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item label="Alvo do efeito" name="targetScope" rules={[{ required: true, message: "Selecione o alvo." }]}>
                                    <Select
                                        style={{ width: 240 }}
                                        options={ABILITY_TARGET_SCOPE_OPTIONS.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item label="Atributo" name="stat" rules={[{ required: true, message: "Selecione o atributo." }]}>
                                    <Select
                                        style={{ width: 220 }}
                                        options={ABILITY_STAT_OPTIONS.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item label="Valor" name="value" rules={[{ required: true, message: "Informe o valor." }]}>
                                    <InputNumber min={0} style={{ width: 140 }} />
                                </Form.Item>
                            </Space>

                            <Form.Item label="Descrição" name="description">
                                <Input.TextArea rows={2} placeholder="Descrição opcional da habilidade" />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" loading={isSaving}>
                                {editingAbilityId ? "Salvar edição" : "Cadastrar habilidade"}
                            </Button>

                            {editingAbilityId ? (
                                <Button onClick={cancelEditAbility}>Cancelar edição</Button>
                            ) : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Habilidades cadastradas" style={{ borderRadius: 16 }}>
                    <Table<AbilityDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        pagination={{ pageSize: 8 }}
                    />
                </Card>
            </Space>
        </AdminShell>
    );
}
