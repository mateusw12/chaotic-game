"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    App as AntdApp,
    Button,
    Card,
    Form,
    Image,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { ArrowLeftOutlined, ThunderboltOutlined } from "@ant-design/icons";
import Link from "next/link";
import { CARD_RARITY_OPTIONS, CREATURE_TRIBE_OPTIONS, type CardRarity, type CreatureTribe } from "@/dto/creature";
import {
    MUGIC_ABILITY_TYPE_OPTIONS,
    MUGIC_ACTION_TYPE_OPTIONS,
    MUGIC_CARD_TYPE_OPTIONS,
    MUGIC_EFFECT_TYPE_OPTIONS,
    MUGIC_STAT_OPTIONS,
    MUGIC_TARGET_SCOPE_OPTIONS,
    type CreateMugicRequestDto,
    type MugicAbilityType,
    type MugicActionType,
    type MugicDto,
    type MugicTargetScope,
} from "@/dto/mugic";
import type { LocationCardType, LocationEffectType, LocationStat } from "@/dto/location";
import { AdminShell } from "@/components/admin/admin-shell";
import { MugicAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";

type MugicViewProps = {
    mugics: MugicDto[];
};

type MugicAbilityFormValues = {
    abilityType: MugicAbilityType;
    description: string;
    effectType?: LocationEffectType;
    stats?: LocationStat[];
    cardTypes: LocationCardType[];
    targetScope: MugicTargetScope;
    value?: number;
    actionType?: MugicActionType;
};

type MugicFormValues = {
    name: string;
    rarity: CardRarity;
    imageFileId?: string;
    tribes: CreatureTribe[];
    cost: number;
    abilities: MugicAbilityFormValues[];
};

const { Title, Text } = Typography;

export function MugicView({ mugics }: MugicViewProps) {
    const { message } = AntdApp.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm<MugicFormValues>();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const { data: rows = [] } = useQuery({
        queryKey: adminQueryKeys.mugic,
        queryFn: () => MugicAdminService.getAll(),
        initialData: mugics,
    });

    const saveMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string | null; payload: CreateMugicRequestDto }) =>
            id ? MugicAdminService.update(id, payload) : MugicAdminService.create(payload),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => MugicAdminService.remove(id),
    });

    async function attachImageFile(file: File & { uid?: string }) {
        setIsImageUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const data = await MugicAdminService.uploadImage(formData);

            if (!data.success || !data.file?.imageFileId) {
                throw new Error(data.message ?? "Falha ao enviar imagem.");
            }

            form.setFieldValue("imageFileId", data.file.imageFileId);
            setImagePreviewUrl(data.file.publicUrl ?? URL.createObjectURL(file));
            setImageFileList([
                {
                    uid: file.uid ?? `${Date.now()}`,
                    name: file.name,
                    status: "done",
                    url: data.file.publicUrl ?? undefined,
                },
            ]);

            message.success("Imagem enviada para o Storage com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao anexar imagem.");
        } finally {
            setIsImageUploading(false);
        }
    }

    async function onSubmit(values: MugicFormValues) {
        try {
            const payload: CreateMugicRequestDto = {
                name: values.name,
                rarity: values.rarity,
                imageFileId: values.imageFileId ?? null,
                tribes: values.tribes,
                cost: Number(values.cost ?? 0),
                abilities: values.abilities.map((ability) => ({
                    abilityType: ability.abilityType,
                    description: ability.description,
                    effectType: ability.effectType,
                    stats: ability.stats ?? [],
                    cardTypes: ability.cardTypes,
                    targetScope: ability.targetScope,
                    value: ability.value,
                    actionType: ability.actionType,
                })),
            };

            const isEditing = Boolean(editingId);
            await saveMutation.mutateAsync({ id: editingId, payload });
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.mugic });

            setEditingId(null);
            form.resetFields();
            setImageFileList([]);
            setImagePreviewUrl(null);
            message.success(isEditing ? "Mugic atualizado com sucesso." : "Mugic cadastrado com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao salvar mugic.");
        }
    }

    const startEdit = useCallback((mugic: MugicDto) => {
        setEditingId(mugic.id);
        form.setFieldsValue({
            name: mugic.name,
            rarity: mugic.rarity,
            imageFileId: mugic.imageFileId ?? undefined,
            tribes: mugic.tribes,
            cost: mugic.cost,
            abilities: mugic.abilities,
        });

        if (mugic.imageUrl) {
            setImagePreviewUrl(mugic.imageUrl);
            setImageFileList([
                {
                    uid: mugic.id,
                    name: "imagem-atual",
                    status: "done",
                    url: mugic.imageUrl,
                },
            ]);
        } else {
            setImagePreviewUrl(null);
            setImageFileList([]);
        }
    }, [form]);

    function cancelEdit() {
        setEditingId(null);
        form.resetFields();
        setImagePreviewUrl(null);
        setImageFileList([]);
    }

    const onDelete = useCallback(async (mugicId: string) => {
        setDeletingId(mugicId);

        try {
            await deleteMutation.mutateAsync(mugicId);
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.mugic });
            message.success("Mugic removido com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao remover mugic.");
        } finally {
            setDeletingId(null);
        }
    }, [deleteMutation, message, queryClient]);

    const columns = useMemo<ColumnsType<MugicDto>>(
        () => [
            {
                title: "Imagem",
                dataIndex: "imageUrl",
                key: "imageUrl",
                width: 100,
                render: (imageUrl: string | null, row) =>
                    imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={row.name}
                            preview={false}
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                        />
                    ) : (
                        <Tag>Sem imagem</Tag>
                    ),
            },
            {
                title: "Nome",
                dataIndex: "name",
                key: "name",
                render: (name: string) => <Text strong>{name}</Text>,
            },
            {
                title: "Raridade",
                dataIndex: "rarity",
                key: "rarity",
                width: 140,
                render: (rarity: CardRarity) => {
                    const option = CARD_RARITY_OPTIONS.find((item) => item.value === rarity);
                    return <Tag color="gold">{option?.label ?? rarity}</Tag>;
                },
            },
            {
                title: "Tribos",
                key: "tribes",
                render: (_, row) => (
                    <Space wrap>
                        {row.tribes.length === 0 ? <Tag>Todas</Tag> : null}
                        {row.tribes.map((tribe) => {
                            const option = CREATURE_TRIBE_OPTIONS.find((item) => item.value === tribe);
                            return (
                                <Tag key={`${row.id}-tribe-${tribe}`} color="purple">
                                    {option?.label ?? tribe}
                                </Tag>
                            );
                        })}
                    </Space>
                ),
            },
            {
                title: "Custo",
                dataIndex: "cost",
                key: "cost",
                width: 90,
            },
            {
                title: "Habilidades",
                key: "abilities",
                render: (_, row) => (
                    <Space orientation="vertical" size={6}>
                        {row.abilities.length === 0 ? <Text type="secondary">Sem habilidades</Text> : null}
                        {row.abilities.map((ability, index) => {
                            const abilityTypeLabel =
                                MUGIC_ABILITY_TYPE_OPTIONS.find((item) => item.value === ability.abilityType)?.label
                                ?? ability.abilityType;
                            const effectLabel =
                                MUGIC_EFFECT_TYPE_OPTIONS.find((item) => item.value === ability.effectType)?.label
                                ?? ability.effectType;
                            const statLabel =
                                (ability.stats ?? [])
                                    .map((stat) => MUGIC_STAT_OPTIONS.find((item) => item.value === stat)?.label ?? stat)
                                    .join(", ");
                            const cardTypesLabel =
                                ability.cardTypes.length === 0
                                    ? "Todas as cartas"
                                    : ability.cardTypes
                                        .map((cardType) => MUGIC_CARD_TYPE_OPTIONS.find((item) => item.value === cardType)?.label ?? cardType)
                                        .join(", ");
                            const targetScopeLabel =
                                MUGIC_TARGET_SCOPE_OPTIONS.find((item) => item.value === ability.targetScope)?.label
                                ?? ability.targetScope;
                            const actionTypeLabel =
                                MUGIC_ACTION_TYPE_OPTIONS.find((item) => item.value === ability.actionType)?.label
                                ?? ability.actionType;

                            if (ability.abilityType === "action") {
                                return (
                                    <Tag key={`${row.id}-ability-${index}`} color="gold">
                                        {ability.description} • {abilityTypeLabel} ({actionTypeLabel}) • {targetScopeLabel}
                                    </Tag>
                                );
                            }

                            return (
                                <Tag key={`${row.id}-ability-${index}`} color={ability.effectType === "increase" ? "green" : "volcano"}>
                                    {ability.description} • {abilityTypeLabel} • {effectLabel} {ability.value} em {statLabel} ({cardTypesLabel}) • {targetScopeLabel}
                                </Tag>
                            );
                        })}
                    </Space>
                ),
            },
            {
                title: "Ações",
                key: "actions",
                width: 190,
                render: (_, row) => (
                    <Space>
                        <Button size="small" onClick={() => startEdit(row)}>
                            Editar
                        </Button>
                        <Popconfirm
                            title="Remover mugic"
                            description="Essa ação não pode ser desfeita."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => onDelete(row.id)}
                        >
                            <Button size="small" danger loading={deletingId === row.id}>
                                Remover
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [deletingId, onDelete, startEdit],
    );

    return (
        <AdminShell selectedKey="mugic">
            <Space orientation="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <ThunderboltOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Cadastro de Mugic
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>
                </Card>

                <Card title="Novo mugic" style={{ borderRadius: 16 }}>
                    <Form<MugicFormValues>
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        initialValues={{
                            rarity: "comum",
                            tribes: [],
                            cost: 0,
                            abilities: [{ abilityType: "stat_modifier", description: "", effectType: "increase", stats: ["speed"], cardTypes: ["creature"], targetScope: "self", value: 0 }],
                        }}
                    >
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome do mugic." }]}>
                                <Input placeholder="Ex.: Canção de Mipedim" />
                            </Form.Item>

                            <Form.Item label="Raridade" name="rarity" rules={[{ required: true, message: "Selecione a raridade." }]}>
                                <Select
                                    options={CARD_RARITY_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                    placeholder="Selecione"
                                />
                            </Form.Item>

                            <Form.Item name="imageFileId" hidden>
                                <Input type="hidden" />
                            </Form.Item>

                            <Form.Item label="Anexar imagem">
                                <Upload
                                    accept="image/*"
                                    maxCount={1}
                                    fileList={imageFileList}
                                    disabled={isImageUploading}
                                    beforeUpload={(file) => {
                                        void attachImageFile(file);
                                        return false;
                                    }}
                                    onRemove={() => {
                                        form.setFieldValue("imageFileId", undefined);
                                        setImagePreviewUrl(null);
                                        setImageFileList([]);
                                    }}
                                >
                                    <Button loading={isImageUploading}>Anexar imagem</Button>
                                </Upload>
                            </Form.Item>

                            {imagePreviewUrl ? (
                                <Image
                                    src={imagePreviewUrl}
                                    alt="Pré-visualização do mugic"
                                    preview={false}
                                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10 }}
                                />
                            ) : null}

                            <Form.Item label="Tribo (opcional)" name="tribes">
                                <Select
                                    mode="multiple"
                                    options={CREATURE_TRIBE_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                    placeholder="Se vazio, qualquer tribo pode usar"
                                />
                            </Form.Item>

                            <Form.Item label="Custo" name="cost" rules={[{ required: true, message: "Informe o custo." }]}>
                                <InputNumber min={0} style={{ width: 160 }} />
                            </Form.Item>

                            <Form.List name="abilities">
                                {(fields, { add, remove }) => (
                                    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                                        <Text strong>Habilidades do mugic</Text>
                                        {fields.map((field) => (
                                            <Card key={field.key} size="small" style={{ borderRadius: 12 }}>
                                                <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                                                    <Form.Item
                                                        label="Descrição"
                                                        name={[field.name, "description"]}
                                                        rules={[{ required: true, message: "Informe a descrição." }]}
                                                    >
                                                        <Input placeholder="Ex.: Reduz energia do adversário" />
                                                    </Form.Item>

                                                    <Space wrap>
                                                        <Form.Item
                                                            label="Tipo de habilidade"
                                                            name={[field.name, "abilityType"]}
                                                            rules={[{ required: true, message: "Selecione o tipo." }]}
                                                        >
                                                            <Select
                                                                style={{ width: 190 }}
                                                                options={MUGIC_ABILITY_TYPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Tipo"
                                                            name={[field.name, "effectType"]}
                                                            dependencies={[["abilities", field.name, "abilityType"]]}
                                                            hidden={form.getFieldValue(["abilities", field.name, "abilityType"]) === "action"}
                                                        >
                                                            <Select
                                                                style={{ width: 180 }}
                                                                options={MUGIC_EFFECT_TYPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Atributos"
                                                            name={[field.name, "stats"]}
                                                            dependencies={[["abilities", field.name, "abilityType"]]}
                                                            hidden={form.getFieldValue(["abilities", field.name, "abilityType"]) === "action"}
                                                        >
                                                            <Select
                                                                mode="multiple"
                                                                style={{ width: 200 }}
                                                                options={MUGIC_STAT_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Tipos de carta"
                                                            name={[field.name, "cardTypes"]}
                                                        >
                                                            <Select
                                                                mode="multiple"
                                                                style={{ width: 220 }}
                                                                options={MUGIC_CARD_TYPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                                placeholder="Se vazio, aplica para todas"
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Alvo"
                                                            name={[field.name, "targetScope"]}
                                                            rules={[{ required: true, message: "Selecione o alvo." }]}
                                                        >
                                                            <Select
                                                                style={{ width: 170 }}
                                                                options={MUGIC_TARGET_SCOPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Valor"
                                                            name={[field.name, "value"]}
                                                            dependencies={[["abilities", field.name, "abilityType"]]}
                                                            hidden={form.getFieldValue(["abilities", field.name, "abilityType"]) === "action"}
                                                        >
                                                            <InputNumber min={0} style={{ width: 120 }} />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Ação"
                                                            name={[field.name, "actionType"]}
                                                            dependencies={[["abilities", field.name, "abilityType"]]}
                                                            hidden={form.getFieldValue(["abilities", field.name, "abilityType"]) !== "action"}
                                                        >
                                                            <Select
                                                                style={{ width: 320 }}
                                                                options={MUGIC_ACTION_TYPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>
                                                    </Space>

                                                    <Button danger onClick={() => remove(field.name)}>
                                                        Remover habilidade
                                                    </Button>
                                                </Space>
                                            </Card>
                                        ))}

                                        <Button
                                            onClick={() => add({ abilityType: "stat_modifier", description: "", effectType: "increase", stats: ["speed"], cardTypes: ["creature"], targetScope: "self", value: 0 })}
                                        >
                                            Adicionar habilidade
                                        </Button>
                                    </Space>
                                )}
                            </Form.List>

                            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                                {editingId ? "Salvar edição" : "Cadastrar mugic"}
                            </Button>

                            {editingId ? <Button onClick={cancelEdit}>Cancelar edição</Button> : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Mugics cadastrados" style={{ borderRadius: 16 }}>
                    <Table<MugicDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 1200 }}
                    />
                </Card>
            </Space>
        </AdminShell>
    );
}
