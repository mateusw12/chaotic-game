"use client";

import { useMemo, useState } from "react";
import { App as AntdApp, Button, Card, Checkbox, Form, Image, Input, InputNumber, Popconfirm, Select, Space, Switch, Table, Tag, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, ShopOutlined } from "@ant-design/icons";
import Link from "next/link";
import { CARD_RARITY_OPTIONS, CREATURE_TRIBE_OPTIONS, type CardRarity, type CreatureTribe } from "@/dto/creature";
import type { AdminStorePackDto } from "@/dto/store";
import type { UserCardType } from "@/dto/progression";
import { StorePacksAdminService } from "@/lib/api/service";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { useImageUploadField } from "@/hooks/use-image-upload-field";

const { Title, Text } = Typography;

type StorePacksViewProps = {
    packs: AdminStorePackDto[];
};

type FormValues = {
    name: string;
    description?: string;
    imageFileId?: string;
    cardsCount: number;
    cardTypes: UserCardType[];
    allowedTribes: CreatureTribe[];
    tribeWeights: Partial<Record<CreatureTribe, number>>;
    rarityWeights: Record<CardRarity, number>;
    guaranteedMinRarity?: CardRarity;
    guaranteedCount: number;
    priceCoins?: number;
    priceDiamonds?: number;
    dailyLimit?: number;
    weeklyLimit?: number;
    isActive: boolean;
};

const CARD_TYPE_OPTIONS: Array<{ value: UserCardType; label: string }> = [
    { value: "creature", label: "Criaturas" },
    { value: "location", label: "Locais" },
    { value: "mugic", label: "Mugic" },
    { value: "battlegear", label: "Equipamentos" },
    { value: "attack", label: "Ataques" },
];

export function StorePacksView({ packs }: StorePacksViewProps) {
    const { message } = AntdApp.useApp();
    const [rows, setRows] = useState<AdminStorePackDto[]>(packs);
    const [creating, setCreating] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [form] = Form.useForm<FormValues>();
    const {
        isUploading,
        previewUrl,
        fileList,
        attachFile,
        clearImage,
    } = useImageUploadField({
        messageApi: message,
        uploadFile: (formData) => StorePacksAdminService.uploadImage(formData),
        getPublicUrl: (response) => response.file?.publicUrl,
        getFieldValue: (response) => response.file?.imageFileId,
        form,
        fieldName: "imageFileId",
        successMessage: "Imagem do pacote enviada com sucesso.",
        defaultErrorMessage: "Erro ao anexar imagem do pacote.",
    });

    const columns = useMemo<ColumnsType<AdminStorePackDto>>(() => [
        {
            title: "Pacote",
            key: "pack",
            render: (_, row) => (
                <Space direction="vertical" size={2}>
                    <Text strong>{row.name}</Text>
                    <Text type="secondary">{row.description}</Text>
                    <Space>
                        <Tag>{row.cardsCount} cartas</Tag>
                        {row.priceCoins ? <Tag color="gold">🪙 {row.priceCoins}</Tag> : null}
                        {row.priceDiamonds ? <Tag color="geekblue">💎 {row.priceDiamonds}</Tag> : null}
                    </Space>
                </Space>
            ),
        },
        {
            title: "Tipos",
            key: "types",
            render: (_, row) => (
                <Space wrap>
                    {row.cardTypes.map((cardType) => (
                        <Tag key={`${row.id}-${cardType}`}>{cardType}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "Tribo(s)",
            key: "tribes",
            render: (_, row) => (
                <Space wrap>
                    {row.allowedTribes.length > 0
                        ? row.allowedTribes.map((tribe) => <Tag key={`${row.id}-${tribe}`}>{tribe}</Tag>)
                        : <Tag>Todas</Tag>}
                </Space>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 110,
            render: (_, row) => <Tag color={row.isActive ? "green" : "default"}>{row.isActive ? "Ativo" : "Inativo"}</Tag>,
        },
        {
            title: "Ações",
            key: "actions",
            width: 110,
            render: (_, row) => (
                <Popconfirm
                    title="Remover pacote"
                    description="Essa ação não pode ser desfeita."
                    okText="Remover"
                    cancelText="Cancelar"
                    onConfirm={async () => {
                        setRemovingId(row.id);
                        try {
                            await StorePacksAdminService.remove(row.id);
                            setRows((previous) => previous.filter((item) => item.id !== row.id));
                            message.success("Pacote removido.");
                        } catch (error) {
                            message.error(error instanceof Error ? error.message : "Erro ao remover pacote.");
                        } finally {
                            setRemovingId(null);
                        }
                    }}
                >
                    <Button danger size="small" icon={removingId === row.id ? <LoadingLogo /> : undefined} disabled={removingId === row.id}>
                        Remover
                    </Button>
                </Popconfirm>
            ),
        },
    ], [message, removingId]);

    const handleCreate = async (values: FormValues) => {
        setCreating(true);

        try {
            const pack = await StorePacksAdminService.create({
                name: values.name,
                description: values.description ?? "",
                imageFileId: values.imageFileId ?? null,
                cardsCount: values.cardsCount,
                cardTypes: values.cardTypes,
                allowedTribes: values.allowedTribes,
                tribeWeights: values.tribeWeights,
                rarityWeights: values.rarityWeights,
                guaranteedMinRarity: values.guaranteedMinRarity ?? null,
                guaranteedCount: values.guaranteedCount,
                priceCoins: values.priceCoins ?? null,
                priceDiamonds: values.priceDiamonds ?? null,
                dailyLimit: values.dailyLimit ?? null,
                weeklyLimit: values.weeklyLimit ?? null,
                isActive: values.isActive,
            });

            setRows((previous) => [pack, ...previous]);
            form.resetFields();
            clearImage();
            message.success("Pacote criado com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao criar pacote.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <AdminShell selectedKey="store-packs">
            <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 1280, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <ShopOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Pacotes da Loja
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>
                </Card>

                <Card title="Novo pacote" style={{ borderRadius: 16 }}>
                    <Form<FormValues>
                        form={form}
                        layout="vertical"
                        onFinish={handleCreate}
                        initialValues={{
                            cardsCount: 6,
                            cardTypes: ["creature", "location", "mugic", "battlegear", "attack"],
                            allowedTribes: [],
                            tribeWeights: {},
                            rarityWeights: { comum: 55, incomum: 25, rara: 14, super_rara: 5, ultra_rara: 1 },
                            guaranteedCount: 0,
                            isActive: true,
                        }}
                    >
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome do pacote" name="name" rules={[{ required: true, message: "Informe o nome." }]}>
                                <Input placeholder="Ex.: Pacote Tribos Raras" />
                            </Form.Item>

                            <Form.Item label="Descrição" name="description">
                                <Input.TextArea rows={2} placeholder="Descrição opcional do pacote" />
                            </Form.Item>

                            <Form.Item name="imageFileId" hidden>
                                <Input type="hidden" />
                            </Form.Item>

                            <Form.Item label="Imagem do pacote (opcional)">
                                <Upload
                                    accept="image/*"
                                    maxCount={1}
                                    fileList={fileList}
                                    disabled={isUploading}
                                    beforeUpload={(file) => {
                                        void attachFile(file as File & { uid?: string });
                                        return false;
                                    }}
                                    onRemove={() => {
                                        clearImage();
                                    }}
                                >
                                    <Button icon={isUploading ? <LoadingLogo /> : undefined} disabled={isUploading}>Anexar imagem</Button>
                                </Upload>
                                {previewUrl ? (
                                    <div style={{ marginTop: 8 }}>
                                        <Image
                                            src={previewUrl}
                                            alt="Pré-visualização do pacote"
                                            width={220}
                                            height={120}
                                            style={{ objectFit: "cover", borderRadius: 10 }}
                                        />
                                    </div>
                                ) : null}
                            </Form.Item>

                            <Space wrap size={12}>
                                <Form.Item label="Qtd. de cartas" name="cardsCount" rules={[{ required: true, message: "Informe a quantidade." }]}>
                                    <InputNumber min={1} style={{ width: 180 }} />
                                </Form.Item>

                                <Form.Item label="Preço em moedas" name="priceCoins">
                                    <InputNumber min={1} style={{ width: 180 }} placeholder="Opcional" />
                                </Form.Item>

                                <Form.Item label="Preço em diamantes" name="priceDiamonds">
                                    <InputNumber min={1} style={{ width: 180 }} placeholder="Opcional" />
                                </Form.Item>
                            </Space>

                            <Form.Item
                                label="Tipos de carta no pacote"
                                name="cardTypes"
                                rules={[{ required: true, message: "Selecione ao menos um tipo." }]}
                            >
                                <Checkbox.Group
                                    options={CARD_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                />
                            </Form.Item>

                            <Form.Item label="Tribos permitidas" name="allowedTribes">
                                <Select
                                    mode="multiple"
                                    options={CREATURE_TRIBE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                    placeholder="Vazio = todas as tribos"
                                />
                            </Form.Item>

                            <Card size="small" title="Probabilidade por raridade">
                                <Space wrap size={12}>
                                    {CARD_RARITY_OPTIONS.map((item) => (
                                        <Form.Item
                                            key={item.value}
                                            label={item.label}
                                            name={["rarityWeights", item.value]}
                                            rules={[{ required: true, message: "Obrigatório" }]}
                                        >
                                            <InputNumber min={0} style={{ width: 120 }} />
                                        </Form.Item>
                                    ))}
                                </Space>
                            </Card>

                            <Card size="small" title="Probabilidade por tribo (opcional)">
                                <Space wrap size={12}>
                                    {CREATURE_TRIBE_OPTIONS.map((item) => (
                                        <Form.Item
                                            key={item.value}
                                            label={item.label}
                                            name={["tribeWeights", item.value]}
                                        >
                                            <InputNumber min={0} style={{ width: 120 }} />
                                        </Form.Item>
                                    ))}
                                </Space>
                            </Card>

                            <Space wrap size={12}>
                                <Form.Item label="Raridade mínima garantida" name="guaranteedMinRarity">
                                    <Select
                                        allowClear
                                        options={CARD_RARITY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                        style={{ width: 220 }}
                                    />
                                </Form.Item>

                                <Form.Item label="Quantidade garantida" name="guaranteedCount">
                                    <InputNumber min={0} style={{ width: 180 }} />
                                </Form.Item>

                                <Form.Item label="Limite diário" name="dailyLimit">
                                    <InputNumber min={0} style={{ width: 180 }} placeholder="Opcional" />
                                </Form.Item>

                                <Form.Item label="Limite semanal" name="weeklyLimit">
                                    <InputNumber min={0} style={{ width: 180 }} placeholder="Opcional" />
                                </Form.Item>
                            </Space>

                            <Form.Item label="Pacote ativo" name="isActive" valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" icon={creating ? <LoadingLogo /> : undefined} disabled={creating}>
                                Criar pacote
                            </Button>
                        </Space>
                    </Form>
                </Card>

                <Card title="Pacotes personalizados cadastrados" style={{ borderRadius: 16 }}>
                    <Table<AdminStorePackDto>
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
