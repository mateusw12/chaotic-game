"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    type AbilityBattleRuleDto,
    type AbilityDto,
    type AbilityEffectType,
    type AbilityStat,
    type AbilityTargetScope,
    type CreateAbilityRequestDto,
} from "@/dto/ability";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { AbilitiesAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { SearchableDataTable } from "@/components/shared/searchable-data-table";

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
    battleRulesJson?: string;
};

function parseBattleRulesJson(value: string | undefined): AbilityBattleRuleDto | null {
    if (!value?.trim()) {
        return null;
    }

    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("battleRules precisa ser um objeto JSON válido.");
    }

    return parsed as AbilityBattleRuleDto;
}

const { Title, Text } = Typography;

export function AbilitiesView({ abilities }: AbilitiesViewProps) {
    const { message } = AntdApp.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm<AbilityFormValues>();
    const [editingAbilityId, setEditingAbilityId] = useState<string | null>(null);
    const [deletingAbilityId, setDeletingAbilityId] = useState<string | null>(null);

    const { data: rows = [] } = useQuery({
        queryKey: adminQueryKeys.abilities,
        queryFn: () => AbilitiesAdminService.getAll(),
        initialData: abilities,
    });

    const saveMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string | null; payload: CreateAbilityRequestDto }) =>
            id ? AbilitiesAdminService.update(id, payload) : AbilitiesAdminService.create(payload),
    });

    const importMutation = useMutation({
        mutationFn: () => AbilitiesAdminService.importFromJson(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AbilitiesAdminService.remove(id),
    });

    async function onCreateAbility(values: AbilityFormValues) {
        try {
            const payload: CreateAbilityRequestDto = {
                name: values.name,
                category: values.category,
                effectType: values.effectType,
                targetScope: values.targetScope,
                stat: values.stat,
                value: values.value,
                description: values.description ?? null,
                battleRules: parseBattleRulesJson(values.battleRulesJson),
            };

            const isEditing = Boolean(editingAbilityId);
            await saveMutation.mutateAsync({
                id: editingAbilityId,
                payload,
            });
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.abilities });

            setEditingAbilityId(null);
            form.resetFields();
            message.success(
                isEditing
                    ? "Habilidade atualizada com sucesso."
                    : "Habilidade cadastrada com sucesso.",
            );
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao salvar habilidade.");
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
            battleRulesJson: ability.battleRules
                ? JSON.stringify(ability.battleRules, null, 2)
                : undefined,
        });
    }, [form]);

    function cancelEditAbility() {
        setEditingAbilityId(null);
        form.resetFields();
    }

    const onDeleteAbility = useCallback(async (abilityId: string) => {
        setDeletingAbilityId(abilityId);

        try {
            await deleteMutation.mutateAsync(abilityId);
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.abilities });
            message.success("Habilidade removida com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao remover habilidade.");
        } finally {
            setDeletingAbilityId(null);
        }
    }, [deleteMutation, message, queryClient]);

    const onImportAbilitiesFromJson = useCallback(async () => {
        try {
            const result = await importMutation.mutateAsync();
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.abilities });

            message.success(
                `${result.fileName}: ${result.imported} importada(s), ${result.updated} atualizada(s), ${result.skipped} ignorada(s).`,
            );
        } catch (error) {
            message.error(
                error instanceof Error
                    ? error.message
                    : "Erro ao importar habilidades do JSON.",
            );
        }
    }, [importMutation, message, queryClient]);

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
                title: "Regra de Batalha",
                key: "battleRules",
                width: 220,
                render: (_, row) => (
                    <Tag color="orange">{row.battleRules?.type ?? "stat_modifier"}</Tag>
                ),
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
                                icon={deletingAbilityId === row.id ? <LoadingLogo /> : undefined}
                                disabled={deletingAbilityId === row.id}
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

                            <Form.Item
                                label="Regras de batalha (JSON)"
                                name="battleRulesJson"
                                extra="Opcional. Use para comportamentos especiais (ex.: discipline_tradeoff, discard_mugic_random)."
                            >
                                <Input.TextArea rows={6} placeholder='{"type":"discipline_tradeoff","requiresTarget":true}' />
                            </Form.Item>

                            <Button onClick={onImportAbilitiesFromJson} icon={importMutation.isPending ? <LoadingLogo /> : undefined} disabled={importMutation.isPending}>
                                Importar abilities.json
                            </Button>

                            <Button type="primary" htmlType="submit" icon={saveMutation.isPending ? <LoadingLogo /> : undefined} disabled={saveMutation.isPending}>
                                {editingAbilityId ? "Salvar edição" : "Cadastrar habilidade"}
                            </Button>

                            {editingAbilityId ? (
                                <Button onClick={cancelEditAbility}>Cancelar edição</Button>
                            ) : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Habilidades cadastradas" style={{ borderRadius: 16 }}>
                    <SearchableDataTable<AbilityDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        searchFields={["name", "category", "description"]}
                        searchPlaceholder="Buscar habilidade por nome, categoria ou descrição"
                        pageSize={8}
                    />
                </Card>
            </Space>
        </AdminShell>
    );
}
