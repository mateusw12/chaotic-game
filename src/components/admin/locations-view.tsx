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
import { ArrowLeftOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
    CREATURE_ELEMENT_OPTIONS,
    CREATURE_TRIBE_OPTIONS,
    type CreatureElement,
    type CreatureTribe,
} from "@/dto/creature";
import {
    LOCATION_CARD_TYPE_OPTIONS,
    LOCATION_EFFECT_TYPE_OPTIONS,
    LOCATION_STAT_OPTIONS,
    type CreateLocationRequestDto,
    type LocationCardType,
    type LocationDto,
    type LocationEffectType,
    type LocationStat,
} from "@/dto/location";
import { AdminShell } from "@/components/admin/admin-shell";

type LocationsViewProps = {
    locations: LocationDto[];
};

type LocationAbilityFormValues = {
    description: string;
    effectType: LocationEffectType;
    stats: LocationStat[];
    cardTypes: LocationCardType[];
    value: number;
};

type LocationFormValues = {
    name: string;
    imageFileId?: string;
    initiativeElements: CreatureElement[];
    tribes: CreatureTribe[];
    abilities: LocationAbilityFormValues[];
};

const { Title, Text } = Typography;

export function LocationsView({ locations }: LocationsViewProps) {
    const { message } = AntdApp.useApp();
    const [form] = Form.useForm<LocationFormValues>();
    const [rows, setRows] = useState<LocationDto[]>(locations);
    const [isSaving, setIsSaving] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
    const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    async function attachImageFile(file: File & { uid?: string }) {
        setIsImageUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/uploads/locations", {
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

    async function onSubmit(values: LocationFormValues) {
        setIsSaving(true);

        try {
            const payload: CreateLocationRequestDto = {
                name: values.name,
                imageFileId: values.imageFileId ?? null,
                initiativeElements: values.initiativeElements,
                tribes: values.tribes,
                abilities: values.abilities.map((ability) => ({
                    description: ability.description,
                    effectType: ability.effectType,
                    stats: ability.stats,
                    cardTypes: ability.cardTypes,
                    value: ability.value,
                })),
            };

            const isEditing = Boolean(editingLocationId);
            const endpoint = isEditing
                ? `/api/admin/locations/${editingLocationId}`
                : "/api/admin/locations";

            const response = await fetch(endpoint, {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = (await response.json()) as {
                success: boolean;
                location: LocationDto | null;
                message?: string;
            };

            if (!response.ok || !data.success || !data.location) {
                throw new Error(data.message ?? "Falha ao salvar local.");
            }

            if (isEditing) {
                setRows((previousRows) =>
                    previousRows.map((row) => (row.id === data.location!.id ? data.location! : row)),
                );
            } else {
                setRows((previousRows) => [data.location as LocationDto, ...previousRows]);
            }

            setEditingLocationId(null);
            form.resetFields();
            setImageFileList([]);
            setImagePreviewUrl(null);
            message.success(isEditing ? "Local atualizado com sucesso." : "Local cadastrado com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao salvar local.");
        } finally {
            setIsSaving(false);
        }
    }

    const startEdit = useCallback((location: LocationDto) => {
        setEditingLocationId(location.id);
        form.setFieldsValue({
            name: location.name,
            imageFileId: location.imageFileId ?? undefined,
            initiativeElements: location.initiativeElements,
            tribes: location.tribes,
            abilities: location.abilities,
        });

        if (location.imageUrl) {
            setImagePreviewUrl(location.imageUrl);
            setImageFileList([
                {
                    uid: location.id,
                    name: "imagem-atual",
                    status: "done",
                    url: location.imageUrl,
                },
            ]);
        } else {
            setImagePreviewUrl(null);
            setImageFileList([]);
        }
    }, [form]);

    function cancelEdit() {
        setEditingLocationId(null);
        form.resetFields();
        setImagePreviewUrl(null);
        setImageFileList([]);
    }

    const onDelete = useCallback(async (locationId: string) => {
        setDeletingLocationId(locationId);

        try {
            const response = await fetch(`/api/admin/locations/${locationId}`, {
                method: "DELETE",
            });

            const data = (await response.json()) as {
                success: boolean;
                message?: string;
            };

            if (!response.ok || !data.success) {
                throw new Error(data.message ?? "Falha ao remover local.");
            }

            setRows((previousRows) => previousRows.filter((row) => row.id !== locationId));
            message.success("Local removido com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao remover local.");
        } finally {
            setDeletingLocationId(null);
        }
    }, [message]);

    const columns = useMemo<ColumnsType<LocationDto>>(
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
                title: "Initiative",
                key: "initiativeElements",
                render: (_, row) => (
                    <Space wrap>
                        {row.initiativeElements.map((element) => {
                            const option = CREATURE_ELEMENT_OPTIONS.find((item) => item.value === element);
                            return (
                                <Tag key={`${row.id}-${element}`} color="blue">
                                    {option?.label ?? element}
                                </Tag>
                            );
                        })}
                    </Space>
                ),
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
                title: "Habilidades do local",
                key: "abilities",
                render: (_, row) => (
                    <Space orientation="vertical" size={6}>
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
                            title="Remover local"
                            description="Essa ação não pode ser desfeita."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => onDelete(row.id)}
                        >
                            <Button size="small" danger loading={deletingLocationId === row.id}>
                                Remover
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [deletingLocationId, onDelete, startEdit],
    );

    return (
        <AdminShell selectedKey="locations">
            <Space orientation="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <EnvironmentOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Cadastro de Locais
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>
                </Card>

                <Card title="Novo local" style={{ borderRadius: 16 }}>
                    <Form<LocationFormValues>
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        initialValues={{
                            initiativeElements: [],
                            tribes: [],
                            abilities: [{ description: "", effectType: "increase", stats: ["speed"], cardTypes: [], value: 0 }],
                        }}
                    >
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome do local." }]}>
                                <Input placeholder="Ex.: Lago de Mipedim" />
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
                                    alt="Pré-visualização do local"
                                    preview={false}
                                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10 }}
                                />
                            ) : null}

                            <Form.Item
                                label="Initiative (elementos)"
                                name="initiativeElements"
                                rules={[{ required: true, message: "Selecione ao menos 1 elemento." }]}
                            >
                                <Select
                                    mode="multiple"
                                    options={CREATURE_ELEMENT_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                    placeholder="Selecione um ou mais"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Tribos afetadas (opcional)"
                                name="tribes"
                            >
                                <Select
                                    mode="multiple"
                                    options={CREATURE_TRIBE_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                    placeholder="Se vazio, aplica para todas as tribos"
                                />
                            </Form.Item>

                            <Form.List name="abilities">
                                {(fields, { add, remove }) => (
                                    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                                        <Text strong>Habilidades do local</Text>
                                        {fields.map((field) => (
                                            <Card key={field.key} size="small" style={{ borderRadius: 12 }}>
                                                <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                                                    <Form.Item
                                                        label="Descrição"
                                                        name={[field.name, "description"]}
                                                        rules={[{ required: true, message: "Informe a descrição." }]}
                                                    >
                                                        <Input placeholder="Ex.: Terreno escorregadio" />
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
                                                                style={{ width: 180 }}
                                                                options={LOCATION_STAT_OPTIONS.map((item) => ({
                                                                    value: item.value,
                                                                    label: item.label,
                                                                }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Tipos de carta (opcional)"
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

                                        <Button onClick={() => add({ description: "", effectType: "increase", stats: ["speed"], cardTypes: [], value: 0 })}>
                                            Adicionar habilidade
                                        </Button>
                                    </Space>
                                )}
                            </Form.List>

                            <Button type="primary" htmlType="submit" loading={isSaving}>
                                {editingLocationId ? "Salvar edição" : "Cadastrar local"}
                            </Button>

                            {editingLocationId ? <Button onClick={cancelEdit}>Cancelar edição</Button> : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Locais cadastrados" style={{ borderRadius: 16 }}>
                    <Table<LocationDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 1000 }}
                    />
                </Card>
            </Space>
        </AdminShell>
    );
}
