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
    Tag,
    Typography,
    Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { ArrowLeftOutlined, FireOutlined } from "@ant-design/icons";
import Link from "next/link";
import { CARD_RARITY_OPTIONS, CREATURE_ELEMENT_OPTIONS, type CardRarity, type CreatureElement } from "@/dto/creature";
import {
    ATTACK_EFFECT_TYPE_OPTIONS,
    ATTACK_STAT_OPTIONS,
    ATTACK_TARGET_SCOPE_OPTIONS,
    type AttackAbilityDto,
    type AttackDto,
    type AttackElementValueDto,
    type AttackTargetScope,
    type CreateAttackRequestDto,
} from "@/dto/attack";
import type { LocationEffectType, LocationStat } from "@/dto/location";
import { AdminShell } from "@/components/admin/admin-shell";
import { AttacksAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { SearchableDataTable } from "@/components/shared/searchable-data-table";
import { LoadingLogo } from "@/components/shared/loading-logo";

type AttacksViewProps = {
    attacks: AttackDto[];
};

type AttackElementValueFormValues = {
    element: CreatureElement;
    value: number;
};

type AttackAbilityFormValues = {
    description: string;
    conditionElement?: CreatureElement;
    targetScope: AttackTargetScope;
    effectType: LocationEffectType;
    stat: LocationStat;
    value: number;
};

type AttackFormValues = {
    name: string;
    rarity: CardRarity;
    imageFileId?: string;
    energyCost: number;
    elementValues: AttackElementValueFormValues[];
    abilities: AttackAbilityFormValues[];
};

const { Title, Text } = Typography;

export function AttacksView({ attacks }: AttacksViewProps) {
    const { notification } = AntdApp.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm<AttackFormValues>();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const { data: rows = [] } = useQuery({
        queryKey: adminQueryKeys.attacks,
        queryFn: () => AttacksAdminService.getAll(),
        initialData: attacks,
    });

    const saveMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string | null; payload: CreateAttackRequestDto }) =>
            id ? AttacksAdminService.update(id, payload) : AttacksAdminService.create(payload),
    });

    const importMutation = useMutation({
        mutationFn: () => AttacksAdminService.importFromJson(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AttacksAdminService.remove(id),
    });

    async function attachImageFile(file: File & { uid?: string }) {
        setIsImageUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const data = await AttacksAdminService.uploadImage(formData);

            if (!data.success || !data.file?.imageFileId) {
                throw new Error(data.message ?? "Falha ao enviar imagem.");
            }

            form.setFieldValue("imageFileId", data.file.imageFileId);
            setImagePreviewUrl(data.file.publicUrl ?? URL.createObjectURL(file));
            setImageFileList([{ uid: file.uid ?? `${Date.now()}`, name: file.name, status: "done", url: data.file.publicUrl ?? undefined }]);

            notification.success({ message: "Imagem enviada para o Storage com sucesso." });
        } catch (error) {
            notification.error({ message: error instanceof Error ? error.message : "Erro ao anexar imagem." });
        } finally {
            setIsImageUploading(false);
        }
    }

    async function onSubmit(values: AttackFormValues) {
        try {
            const payload: CreateAttackRequestDto = {
                name: values.name,
                rarity: values.rarity,
                imageFileId: values.imageFileId ?? null,
                energyCost: Number(values.energyCost ?? 0),
                elementValues: values.elementValues.map((item): AttackElementValueDto => ({
                    element: item.element,
                    value: Number(item.value ?? 0),
                })),
                abilities: values.abilities.map((ability): AttackAbilityDto => ({
                    description: ability.description,
                    conditionElement: ability.conditionElement,
                    targetScope: ability.targetScope,
                    effectType: ability.effectType,
                    stat: ability.stat,
                    value: Number(ability.value ?? 0),
                })),
            };

            const isEditing = Boolean(editingId);
            await saveMutation.mutateAsync({ id: editingId, payload });
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.attacks });

            setEditingId(null);
            form.resetFields();
            setImageFileList([]);
            setImagePreviewUrl(null);
            notification.success({ message: isEditing ? "Ataque atualizado com sucesso." : "Ataque cadastrado com sucesso." });
        } catch (error) {
            notification.error({ message: error instanceof Error ? error.message : "Erro ao salvar ataque." });
        }
    }

    const startEdit = useCallback((attack: AttackDto) => {
        setEditingId(attack.id);
        form.setFieldsValue({
            name: attack.name,
            rarity: attack.rarity,
            imageFileId: attack.imageFileId ?? undefined,
            energyCost: attack.energyCost,
            elementValues: attack.elementValues,
            abilities: attack.abilities,
        });

        if (attack.imageUrl) {
            setImagePreviewUrl(attack.imageUrl);
            setImageFileList([{ uid: attack.id, name: "imagem-atual", status: "done", url: attack.imageUrl }]);
        } else {
            setImagePreviewUrl(null);
            setImageFileList([]);
        }
    }, [form]);

    function cancelEdit() {
        setEditingId(null);
        form.resetFields();
        setImageFileList([]);
        setImagePreviewUrl(null);
    }

    const onDelete = useCallback(async (attackId: string) => {
        setDeletingId(attackId);

        try {
            await deleteMutation.mutateAsync(attackId);
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.attacks });
            notification.success({ message: "Ataque removido com sucesso." });
        } catch (error) {
            notification.error({ message: error instanceof Error ? error.message : "Erro ao remover ataque." });
        } finally {
            setDeletingId(null);
        }
    }, [deleteMutation, notification, queryClient]);

    const onImportAttacksFromJson = useCallback(async () => {
        try {
            const result = await importMutation.mutateAsync();
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.attacks });

            notification.success({ message: `${result.fileName}: ${result.imported} importada(s), ${result.updated} atualizada(s), ${result.skipped} ignorada(s).` });
        } catch (error) {
            notification.error({
                message: error instanceof Error
                    ? error.message
                    : "Erro ao importar ataques do JSON.",
            });
        }
    }, [importMutation, notification, queryClient]);

    const columns = useMemo<ColumnsType<AttackDto>>(
        () => [
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
                title: "Custo",
                dataIndex: "energyCost",
                key: "energyCost",
                width: 90,
            },
            {
                title: "Elementos",
                key: "elementValues",
                render: (_, row) => (
                    <Space wrap>
                        {row.elementValues.map((item, index) => {
                            const elementLabel = CREATURE_ELEMENT_OPTIONS.find((option) => option.value === item.element)?.label ?? item.element;
                            return (
                                <Tag key={`${row.id}-element-${index}`} color="blue">
                                    {elementLabel}: {item.value}
                                </Tag>
                            );
                        })}
                    </Space>
                ),
            },
            {
                title: "Habilidades",
                key: "abilities",
                render: (_, row) => (
                    <Space orientation="vertical" size={6}>
                        {row.abilities.length === 0 ? <Text type="secondary">Sem habilidades</Text> : null}
                        {row.abilities.map((ability, index) => {
                            const conditionElementLabel = ability.conditionElement
                                ? CREATURE_ELEMENT_OPTIONS.find((item) => item.value === ability.conditionElement)?.label ?? ability.conditionElement
                                : "qualquer elemento";
                            const targetLabel = ATTACK_TARGET_SCOPE_OPTIONS.find((item) => item.value === ability.targetScope)?.label ?? ability.targetScope;
                            const effectLabel = ATTACK_EFFECT_TYPE_OPTIONS.find((item) => item.value === ability.effectType)?.label ?? ability.effectType;
                            const statLabel = ATTACK_STAT_OPTIONS.find((item) => item.value === ability.stat)?.label ?? ability.stat;

                            return (
                                <Tag key={`${row.id}-ability-${index}`} color={ability.effectType === "increase" ? "green" : "volcano"}>
                                    {ability.description} • se atacante for {conditionElementLabel} • {targetLabel} {effectLabel} {ability.value} em {statLabel}
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
                        <Button size="small" onClick={() => startEdit(row)}>Editar</Button>
                        <Popconfirm
                            title="Remover ataque"
                            description="Essa ação não pode ser desfeita."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => onDelete(row.id)}
                        >
                            <Button size="small" danger icon={deletingId === row.id ? <LoadingLogo /> : undefined} disabled={deletingId === row.id}>Remover</Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [deletingId, onDelete, startEdit],
    );

    return (
        <AdminShell selectedKey="attacks">
            <Space orientation="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <FireOutlined />
                            <Title level={3} style={{ margin: 0 }}>Cadastro de Ataques</Title>
                        </Space>

                        <Space>
                            <Button onClick={() => void onImportAttacksFromJson()} icon={importMutation.isPending ? <LoadingLogo /> : undefined} disabled={importMutation.isPending}>
                                Importar attack.json
                            </Button>
                            <Link href="/">
                                <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                            </Link>
                        </Space>
                    </Space>
                </Card>

                <Card title="Novo ataque" style={{ borderRadius: 16 }}>
                    <Form<AttackFormValues>
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        initialValues={{
                            rarity: "comum",
                            energyCost: 0,
                            elementValues: [{ element: "fire", value: 0 }],
                            abilities: [{ description: "", conditionElement: undefined, targetScope: "attacker", effectType: "increase", stat: "courage", value: 0 }],
                        }}
                    >
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome do ataque." }]}>
                                <Input placeholder="Ex.: Chuva de Lava" />
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
                                    <Button icon={isImageUploading ? <LoadingLogo /> : undefined} disabled={isImageUploading}>Anexar imagem</Button>
                                </Upload>
                            </Form.Item>

                            {imagePreviewUrl ? (
                                <Image src={imagePreviewUrl} alt="Pré-visualização do ataque" preview={false} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10 }} />
                            ) : null}

                            <Form.Item label="Custo de energia" name="energyCost" rules={[{ required: true, message: "Informe o custo de energia." }]}>
                                <InputNumber min={0} style={{ width: 180 }} />
                            </Form.Item>

                            <Form.List name="elementValues">
                                {(fields, { add, remove }) => (
                                    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                                        <Text strong>Elementos e valores</Text>
                                        {fields.map((field) => (
                                            <Card key={field.key} size="small" style={{ borderRadius: 12 }}>
                                                <Space wrap>
                                                    <Form.Item
                                                        label="Elemento"
                                                        name={[field.name, "element"]}
                                                        rules={[{ required: true, message: "Selecione o elemento." }]}
                                                    >
                                                        <Select
                                                            style={{ width: 180 }}
                                                            options={CREATURE_ELEMENT_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item
                                                        label="Valor"
                                                        name={[field.name, "value"]}
                                                        rules={[{ required: true, message: "Informe o valor." }]}
                                                    >
                                                        <InputNumber min={0} style={{ width: 120 }} />
                                                    </Form.Item>

                                                    <Button danger onClick={() => remove(field.name)}>Remover elemento</Button>
                                                </Space>
                                            </Card>
                                        ))}

                                        <Button onClick={() => add({ element: "fire", value: 0 })}>Adicionar elemento</Button>
                                    </Space>
                                )}
                            </Form.List>

                            <Form.List name="abilities">
                                {(fields, { add, remove }) => (
                                    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                                        <Text strong>Habilidades do ataque</Text>
                                        {fields.map((field) => (
                                            <Card key={field.key} size="small" style={{ borderRadius: 12 }}>
                                                <Space orientation="vertical" size={10} style={{ width: "100%" }}>
                                                    <Form.Item
                                                        label="Descrição"
                                                        name={[field.name, "description"]}
                                                        rules={[{ required: true, message: "Informe a descrição." }]}
                                                    >
                                                        <Input placeholder="Ex.: Se a criatura atacante for água, ganha coragem." />
                                                    </Form.Item>

                                                    <Space wrap>
                                                        <Form.Item label="Condição por elemento (opcional)" name={[field.name, "conditionElement"]}>
                                                            <Select
                                                                allowClear
                                                                style={{ width: 220 }}
                                                                options={CREATURE_ELEMENT_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                                                placeholder="Se vazio, qualquer elemento"
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Afeta"
                                                            name={[field.name, "targetScope"]}
                                                            rules={[{ required: true, message: "Selecione alvo." }]}
                                                        >
                                                            <Select
                                                                style={{ width: 170 }}
                                                                options={ATTACK_TARGET_SCOPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Tipo"
                                                            name={[field.name, "effectType"]}
                                                            rules={[{ required: true, message: "Selecione aumentar/diminuir." }]}
                                                        >
                                                            <Select
                                                                style={{ width: 170 }}
                                                                options={ATTACK_EFFECT_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                                            />
                                                        </Form.Item>

                                                        <Form.Item
                                                            label="Atributo"
                                                            name={[field.name, "stat"]}
                                                            rules={[{ required: true, message: "Selecione atributo." }]}
                                                        >
                                                            <Select
                                                                style={{ width: 170 }}
                                                                options={ATTACK_STAT_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
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

                                                    <Button danger onClick={() => remove(field.name)}>Remover habilidade</Button>
                                                </Space>
                                            </Card>
                                        ))}

                                        <Button onClick={() => add({ description: "", conditionElement: undefined, targetScope: "attacker", effectType: "increase", stat: "courage", value: 0 })}>
                                            Adicionar habilidade
                                        </Button>
                                    </Space>
                                )}
                            </Form.List>

                            <Button type="primary" htmlType="submit" icon={saveMutation.isPending ? <LoadingLogo /> : undefined} disabled={saveMutation.isPending}>
                                {editingId ? "Salvar edição" : "Cadastrar ataque"}
                            </Button>

                            {editingId ? <Button onClick={cancelEdit}>Cancelar edição</Button> : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Ataques cadastrados" style={{ borderRadius: 16 }}>
                    <SearchableDataTable<AttackDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        searchFields={["name", "rarity"]}
                        searchPlaceholder="Buscar ataque por nome ou raridade"
                        pageSize={8}
                        scrollX={1200}
                    />
                </Card>
            </Space>
        </AdminShell>
    );
}
