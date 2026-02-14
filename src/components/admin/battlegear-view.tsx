"use client";

import { useCallback, useMemo, useState } from "react";
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
import { ArrowLeftOutlined, ToolOutlined } from "@ant-design/icons";
import Link from "next/link";
import { CREATURE_TRIBE_OPTIONS, type CreatureDto, type CreatureTribe } from "@/dto/creature";
import {
    LOCATION_CARD_TYPE_OPTIONS,
    LOCATION_EFFECT_TYPE_OPTIONS,
    LOCATION_STAT_OPTIONS,
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
} from "@/dto/location";
import {
    type BattleGearDto,
    type CreateBattleGearRequestDto,
} from "@/dto/battlegear";
import { AdminShell } from "@/components/admin/admin-shell";

type BattleGearViewProps = {
    battlegear: BattleGearDto[];
    creatures: CreatureDto[];
};

type BattleGearAbilityFormValues = {
    description: string;
    effectType: LocationEffectType;
    stats: LocationStat[];
    cardTypes: LocationCardType[];
    value: number;
};

type BattleGearFormValues = {
    name: string;
    imageFileId?: string;
    allowedTribes: CreatureTribe[];
    allowedCreatureIds: string[];
    abilities: BattleGearAbilityFormValues[];
};

const { Title, Text } = Typography;

export function BattleGearView({ battlegear, creatures }: BattleGearViewProps) {
    const { message } = AntdApp.useApp();
    const [form] = Form.useForm<BattleGearFormValues>();
    const [rows, setRows] = useState<BattleGearDto[]>(battlegear);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const creatureOptions = useMemo(
        () => creatures.map((creature) => ({ value: creature.id, label: creature.name })),
        [creatures],
    );

    async function attachImageFile(file: File & { uid?: string }) {
        setIsImageUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/uploads/battlegear", {
                method: "POST",
                body: formData,
            });

            const data = (await response.json()) as {
                success: boolean;
                file: { imageFileId: string; path: string; publicUrl: string | null } | null;
                message?: string;
            };

            if (!response.ok || !data.success || !data.file?.imageFileId) {
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

    async function onSubmit(values: BattleGearFormValues) {
        setIsSaving(true);

        try {
            const payload: CreateBattleGearRequestDto = {
                name: values.name,
                imageFileId: values.imageFileId ?? null,
                allowedTribes: values.allowedTribes,
                allowedCreatureIds: values.allowedCreatureIds,
                abilities: values.abilities.map((ability) => ({
                    description: ability.description,
                    effectType: ability.effectType,
                    stats: ability.stats,
                    cardTypes: ability.cardTypes,
                    value: ability.value,
                })),
            };

            const isEditing = Boolean(editingId);
            const endpoint = isEditing
                ? `/api/admin/battlegear/${editingId}`
                : "/api/admin/battlegear";

            const response = await fetch(endpoint, {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = (await response.json()) as {
                success: boolean;
                battlegearItem: BattleGearDto | null;
                message?: string;
            };

            if (!response.ok || !data.success || !data.battlegearItem) {
                throw new Error(data.message ?? "Falha ao salvar equipamento.");
            }

            if (isEditing) {
                setRows((previousRows) =>
                    previousRows.map((row) => (row.id === data.battlegearItem!.id ? data.battlegearItem! : row)),
                );
            } else {
                setRows((previousRows) => [data.battlegearItem as BattleGearDto, ...previousRows]);
            }

            setEditingId(null);
            form.resetFields();
            setImageFileList([]);
            setImagePreviewUrl(null);
            message.success(isEditing ? "Equipamento atualizado com sucesso." : "Equipamento cadastrado com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao salvar equipamento.");
        } finally {
            setIsSaving(false);
        }
    }

    const startEdit = useCallback((item: BattleGearDto) => {
        setEditingId(item.id);
        form.setFieldsValue({
            name: item.name,
            imageFileId: item.imageFileId ?? undefined,
            allowedTribes: item.allowedTribes,
            allowedCreatureIds: item.allowedCreatureIds,
            abilities: item.abilities,
        });

        if (item.imageUrl) {
            setImagePreviewUrl(item.imageUrl);
            setImageFileList([
                {
                    uid: item.id,
                    name: "imagem-atual",
                    status: "done",
                    url: item.imageUrl,
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

    const onDelete = useCallback(async (itemId: string) => {
        setDeletingId(itemId);

        try {
            const response = await fetch(`/api/admin/battlegear/${itemId}`, {
                method: "DELETE",
            });

            const data = (await response.json()) as {
                success: boolean;
                message?: string;
            };

            if (!response.ok || !data.success) {
                throw new Error(data.message ?? "Falha ao remover equipamento.");
            }

            setRows((previousRows) => previousRows.filter((row) => row.id !== itemId));
            message.success("Equipamento removido com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao remover equipamento.");
        } finally {
            setDeletingId(null);
        }
    }, [message]);

    const columns = useMemo<ColumnsType<BattleGearDto>>(
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
                title: "Restrições",
                key: "restrictions",
                render: (_, row) => (
                    <Space direction="vertical" size={4}>
                        <Space wrap>
                            <Text type="secondary">Tribos:</Text>
                            {row.allowedTribes.length === 0 ? <Tag>Todas</Tag> : null}
                            {row.allowedTribes.map((tribe) => {
                                const option = CREATURE_TRIBE_OPTIONS.find((item) => item.value === tribe);
                                return (
                                    <Tag key={`${row.id}-tribe-${tribe}`} color="purple">
                                        {option?.label ?? tribe}
                                    </Tag>
                                );
                            })}
                        </Space>

                        <Space wrap>
                            <Text type="secondary">Criaturas:</Text>
                            {row.allowedCreatureIds.length === 0 ? <Tag>Todas</Tag> : null}
                            {row.allowedCreatureIds.map((creatureId) => {
                                const creatureName = creatures.find((creature) => creature.id === creatureId)?.name ?? creatureId;
                                return (
                                    <Tag key={`${row.id}-creature-${creatureId}`} color="geekblue">
                                        {creatureName}
                                    </Tag>
                                );
                            })}
                        </Space>
                    </Space>
                ),
            },
            {
                title: "Habilidades",
                key: "abilities",
                render: (_, row) => (
                    <Space direction="vertical" size={6}>
                        {row.abilities.length === 0 ? <Text type="secondary">Sem habilidades</Text> : null}
                        {row.abilities.map((ability, index) => {
                            const effectLabel =
                                LOCATION_EFFECT_TYPE_OPTIONS.find((item) => item.value === ability.effectType)?.label
                                ?? ability.effectType;
                            const statLabel =
                                ability.stats
                                    .map((stat) => LOCATION_STAT_OPTIONS.find((item) => item.value === stat)?.label ?? stat)
                                    .join(", ");
                            const cardTypesLabel =
                                ability.cardTypes.length === 0
                                    ? "Todas as cartas"
                                    : ability.cardTypes
                                        .map((cardType) => LOCATION_CARD_TYPE_OPTIONS.find((item) => item.value === cardType)?.label ?? cardType)
                                        .join(", ");

                            return (
                                <Tag key={`${row.id}-ability-${index}`} color={ability.effectType === "increase" ? "green" : "volcano"}>
                                    {ability.description} • {effectLabel} {ability.value} em {statLabel} ({cardTypesLabel})
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
                            title="Remover equipamento"
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
        [creatures, deletingId, onDelete, startEdit],
    );

    return (
        <AdminShell selectedKey="battlegear">
            <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <ToolOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Cadastro de Equipamento de Batalha
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>
                </Card>

                <Card title="Novo equipamento" style={{ borderRadius: 16 }}>
                    <Form<BattleGearFormValues>
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        initialValues={{
                            allowedTribes: [],
                            allowedCreatureIds: [],
                            abilities: [{ description: "", effectType: "increase", stats: ["speed"], cardTypes: ["creature"], value: 0 }],
                        }}
                    >
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome do equipamento." }]}>
                                <Input placeholder="Ex.: Battle Gear de Mipedim" />
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
                                    alt="Pré-visualização do equipamento"
                                    preview={false}
                                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10 }}
                                />
                            ) : null}

                            <Form.Item label="Restringir por tribos (opcional)" name="allowedTribes">
                                <Select
                                    mode="multiple"
                                    options={CREATURE_TRIBE_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                    placeholder="Se vazio, qualquer tribo pode usar"
                                />
                            </Form.Item>

                            <Form.Item label="Restringir por criaturas (opcional)" name="allowedCreatureIds">
                                <Select
                                    mode="multiple"
                                    options={creatureOptions}
                                    placeholder="Se vazio, qualquer criatura pode usar"
                                />
                            </Form.Item>

                            <Form.List name="abilities">
                                {(fields, { add, remove }) => (
                                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                        <Text strong>Habilidades do equipamento</Text>
                                        {fields.map((field) => (
                                            <Card key={field.key} size="small" style={{ borderRadius: 12 }}>
                                                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                                    <Form.Item
                                                        label="Descrição"
                                                        name={[field.name, "description"]}
                                                        rules={[{ required: true, message: "Informe a descrição." }]}
                                                    >
                                                        <Input placeholder="Ex.: Equipado ganha velocidade" />
                                                    </Form.Item>

                                                    <Space wrap>
                                                        <Form.Item
                                                            label="Tipo"
                                                            name={[field.name, "effectType"]}
                                                            rules={[{ required: true, message: "Selecione aumentar/diminuir." }]}
                                                        >
                                                            <Select
                                                                style={{ width: 180 }}
                                                                options={LOCATION_EFFECT_TYPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Atributos"
                                                            name={[field.name, "stats"]}
                                                            rules={[{ required: true, message: "Selecione ao menos 1 atributo." }]}
                                                        >
                                                            <Select
                                                                mode="multiple"
                                                                style={{ width: 200 }}
                                                                options={LOCATION_STAT_OPTIONS.map((item) => ({
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
                                                                options={LOCATION_CARD_TYPE_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                                placeholder="Se vazio, aplica para todas"
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Valor"
                                                            name={[field.name, "value"]}
                                                            rules={[{ required: true, message: "Informe valor." }]}
                                                        >
                                                            <InputNumber min={0} style={{ width: 120 }} />
                                                        </Form.Item>
                                                    </Space>

                                                    <Button danger onClick={() => remove(field.name)}>
                                                        Remover habilidade
                                                    </Button>
                                                </Space>
                                            </Card>
                                        ))}

                                        <Button
                                            onClick={() => add({ description: "", effectType: "increase", stats: ["speed"], cardTypes: ["creature"], value: 0 })}
                                        >
                                            Adicionar habilidade
                                        </Button>
                                    </Space>
                                )}
                            </Form.List>

                            <Button type="primary" htmlType="submit" loading={isSaving}>
                                {editingId ? "Salvar edição" : "Cadastrar equipamento"}
                            </Button>

                            {editingId ? <Button onClick={cancelEdit}>Cancelar edição</Button> : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Equipamentos cadastrados" style={{ borderRadius: 16 }}>
                    <Table<BattleGearDto>
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
