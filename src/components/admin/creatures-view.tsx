"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App as AntdApp, Button, Card, Form, Image, Input, InputNumber, Popconfirm, Select, Space, Tag, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowLeftOutlined, BookOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
    CARD_RARITY_OPTIONS,
    CREATURE_ELEMENT_OPTIONS,
    CREATURE_TRIBE_OPTIONS,
    type CardRarity,
    type CreateCreatureRequestDto,
    type CreatureDto,
    type CreatureElement,
    type CreatureTribe,
} from "@/dto/creature";
import { AdminShell } from "@/components/admin/admin-shell";
import { AbilitiesAdminService, CreaturesAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { SearchableDataTable } from "@/components/shared/searchable-data-table";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { useImageUploadField } from "@/hooks/use-image-upload-field";
import { useFormSubmitToast } from "@/hooks/use-form-submit-toast";

type CreaturesViewProps = {
    creatures: CreatureDto[];
};

const { Title, Text } = Typography;

type CreatureFormValues = {
    name: string;
    rarity: CardRarity;
    imageFileId?: string;
    tribe: CreatureTribe;
    power: number;
    courage: number;
    speed: number;
    wisdom: number;
    mugic: number;
    energy: number;
    dominantElements: CreatureElement[];
    supportAbilityId: string[];
    brainwashedAbilityId: string[];
    equipmentNote?: string;
};

export function CreaturesView({ creatures }: CreaturesViewProps) {
    const { notification } = AntdApp.useApp();
    const { runWithSubmitToast } = useFormSubmitToast(notification);
    const queryClient = useQueryClient();
    const [creatureForm] = Form.useForm<CreatureFormValues>();
    const [editingCreatureId, setEditingCreatureId] = useState<string | null>(null);
    const [deletingCreatureId, setDeletingCreatureId] = useState<string | null>(null);

    const {
        isUploading: isImageUploading,
        previewUrl: imagePreviewUrl,
        fileList: imageFileList,
        attachFile: attachImageFile,
        clearImage,
        setExistingImage,
    } = useImageUploadField({
        messageApi: notification,
        form: creatureForm,
        fieldName: "imageFileId",
        uploadFile: (formData) => CreaturesAdminService.uploadImage(formData),
        getFieldValue: (response) => {
            if (!response.success || !response.file?.imageFileId) {
                throw new Error(response.message ?? "Falha ao enviar imagem.");
            }

            return response.file.imageFileId;
        },
        getPublicUrl: (response) => {
            if (!response.success || !response.file?.imageFileId) {
                throw new Error(response.message ?? "Falha ao enviar imagem.");
            }

            return response.file.publicUrl;
        },
        successMessage: "Imagem enviada para o Storage com sucesso.",
        defaultErrorMessage: "Erro ao anexar imagem.",
    });

    const { data: rows = [] } = useQuery({
        queryKey: adminQueryKeys.creatures,
        queryFn: () => CreaturesAdminService.getAll(),
        initialData: creatures,
    });

    const { data: abilities = [] } = useQuery({
        queryKey: adminQueryKeys.abilities,
        queryFn: () => AbilitiesAdminService.getAll(),
    });

    const supportAbilityOptions = useMemo(
        () => abilities
            .filter((ability) => ability.category === "support")
            .map((ability) => ({ value: ability.id, label: ability.name })),
        [abilities],
    );

    const brainwashedAbilityOptions = useMemo(
        () => abilities
            .filter((ability) => ability.category === "brainwashed")
            .map((ability) => ({ value: ability.id, label: ability.name })),
        [abilities],
    );

    const saveMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string | null; payload: CreateCreatureRequestDto }) =>
            id ? CreaturesAdminService.update(id, payload) : CreaturesAdminService.create(payload),
    });

    const importMutation = useMutation({
        mutationFn: () => CreaturesAdminService.importFromJson(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => CreaturesAdminService.remove(id),
    });

    async function onCreateCreature(values: CreatureFormValues) {
        const payload: CreateCreatureRequestDto = {
            name: values.name,
            rarity: values.rarity,
            imageFileId: values.imageFileId ?? null,
            tribe: values.tribe,
            power: values.power,
            courage: values.courage,
            speed: values.speed,
            wisdom: values.wisdom,
            mugic: values.mugic,
            energy: values.energy,
            dominantElements: values.dominantElements,
            supportAbilityId: values.supportAbilityId,
            brainwashedAbilityId: values.brainwashedAbilityId,
            equipmentNote: values.equipmentNote ?? null,
        };

        const isEditing = Boolean(editingCreatureId);
        await runWithSubmitToast(
            async () => {
                await saveMutation.mutateAsync({
                    id: editingCreatureId,
                    payload,
                });
                await queryClient.invalidateQueries({ queryKey: adminQueryKeys.creatures });

                setEditingCreatureId(null);
                creatureForm.resetFields();
                clearImage();
            },
            {
                successMessage: isEditing
                    ? "Criatura atualizada com sucesso."
                    : "Criatura cadastrada com sucesso.",
                defaultErrorMessage: "Erro ao salvar criatura.",
            },
        );
    }

    const startEditCreature = useCallback((creature: CreatureDto) => {
        setEditingCreatureId(creature.id);
        creatureForm.setFieldsValue({
            name: creature.name,
            rarity: creature.rarity,
            imageFileId: creature.imageFileId ?? undefined,
            tribe: creature.tribe,
            power: creature.power,
            courage: creature.courage,
            speed: creature.speed,
            wisdom: creature.wisdom,
            mugic: creature.mugic,
            energy: creature.energy,
            dominantElements: creature.dominantElements,
            supportAbilityId: creature.supportAbilityId,
            brainwashedAbilityId: creature.brainwashedAbilityId,
            equipmentNote: creature.equipmentNote ?? undefined,
        });

        setExistingImage({
            url: creature.imageUrl,
            uid: creature.id,
            name: "imagem-atual",
        });
    }, [creatureForm, setExistingImage]);

    function cancelEditCreature() {
        setEditingCreatureId(null);
        creatureForm.resetFields();
        clearImage();
    }

    const onDeleteCreature = useCallback(async (creatureId: string) => {
        setDeletingCreatureId(creatureId);

        try {
            await runWithSubmitToast(
                async () => {
                    await deleteMutation.mutateAsync(creatureId);
                    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.creatures });
                },
                {
                    successMessage: "Criatura removida com sucesso.",
                    defaultErrorMessage: "Erro ao remover criatura.",
                },
            );
        } finally {
            setDeletingCreatureId(null);
        }
    }, [deleteMutation, queryClient, runWithSubmitToast]);

    const onImportCreaturesFromJson = useCallback(async () => {
        try {
            const result = await importMutation.mutateAsync();
            await queryClient.invalidateQueries({ queryKey: adminQueryKeys.creatures });

            notification.success({ message: `${result.fileName}: ${result.imported} importada(s), ${result.updated} atualizada(s), ${result.skipped} ignorada(s).` });
        } catch (error) {
            notification.error({
                message: error instanceof Error
                    ? error.message
                    : "Erro ao importar criaturas do JSON.",
            });
        }
    }, [importMutation, notification, queryClient]);

    const columns = useMemo<ColumnsType<CreatureDto>>(
        () => [
            {
                title: "Nome",
                dataIndex: "name",
                key: "name",
                width: 220,
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
                title: "Tribo",
                dataIndex: "tribe",
                key: "tribe",
                width: 170,
                render: (tribe: CreatureTribe) => {
                    const option = CREATURE_TRIBE_OPTIONS.find((item) => item.value === tribe);
                    return <Tag color="purple">{option?.label ?? tribe}</Tag>;
                },
            },
            {
                title: "Atributos",
                key: "stats",
                render: (_, row) => (
                    <Space wrap>
                        <Tag>POD {row.power}</Tag>
                        <Tag>COR {row.courage}</Tag>
                        <Tag>VEL {row.speed}</Tag>
                        <Tag>SAB {row.wisdom}</Tag>
                        <Tag>MUJ {row.mugic}</Tag>
                        <Tag>ENE {row.energy}</Tag>
                    </Space>
                ),
            },
            {
                title: "Elementos",
                key: "dominantElements",
                render: (_, row) => (
                    <Space wrap>
                        {row.dominantElements.map((element) => {
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
                title: "Habilidades",
                key: "abilities",
                width: 260,
                render: (_, row) => (
                    <Space orientation="vertical" size={6}>
                        <Tag color="geekblue">
                            Support: {row.supportAbilityName.length > 0 ? row.supportAbilityName.join(", ") : "Sem habilidade"}
                        </Tag>
                        <Tag color="magenta">
                            Brainwashed: {row.brainwashedAbilityName.length > 0 ? row.brainwashedAbilityName.join(", ") : "Sem habilidade"}
                        </Tag>
                    </Space>
                ),
            },
            {
                title: "Ações",
                key: "actions",
                width: 190,
                render: (_, row) => (
                    <Space>
                        <Button size="small" onClick={() => startEditCreature(row)}>
                            Editar
                        </Button>
                        <Popconfirm
                            title="Remover criatura"
                            description="Essa ação não pode ser desfeita."
                            okText="Remover"
                            cancelText="Cancelar"
                            onConfirm={() => onDeleteCreature(row.id)}
                        >
                            <Button
                                size="small"
                                danger
                                icon={deletingCreatureId === row.id ? <LoadingLogo /> : undefined}
                                disabled={deletingCreatureId === row.id}
                            >
                                Remover
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [deletingCreatureId, onDeleteCreature, startEditCreature],
    );

    return (
        <AdminShell selectedKey="creatures">
            <Space orientation="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
                <Card style={{ borderRadius: 16 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <BookOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Cadastro de Criaturas
                            </Title>
                        </Space>

                        <Link href="/">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>
                </Card>

                <Card title="Nova criatura" style={{ borderRadius: 16 }}>
                    <Form<CreatureFormValues>
                        form={creatureForm}
                        layout="vertical"
                        onFinish={onCreateCreature}
                        initialValues={{
                            rarity: "comum",
                            power: 0,
                            courage: 0,
                            speed: 0,
                            wisdom: 0,
                            mugic: 0,
                            energy: 0,
                            dominantElements: [],
                            supportAbilityId: [],
                            brainwashedAbilityId: [],
                        }}
                    >
                        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                            <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome." }]}>
                                <Input placeholder="Ex.: Accato" />
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
                                    onRemove={() => clearImage()}
                                >
                                    <Button icon={isImageUploading ? <LoadingLogo /> : undefined} disabled={isImageUploading}>Anexar imagem</Button>
                                </Upload>
                            </Form.Item>

                            {imagePreviewUrl ? (
                                <Image
                                    src={imagePreviewUrl}
                                    alt="Pré-visualização da criatura"
                                    preview={false}
                                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10 }}
                                />
                            ) : null}

                            <Form.Item label="Tribo" name="tribe" rules={[{ required: true, message: "Selecione a tribo." }]}>
                                <Select
                                    options={CREATURE_TRIBE_OPTIONS.map((item) => ({
                                        value: item.value,
                                        label: item.label,
                                    }))}
                                    placeholder="Selecione"
                                />
                            </Form.Item>

                            <Space wrap size={12}>
                                <Form.Item label="Poder" name="power" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: 120 }} />
                                </Form.Item>
                                <Form.Item label="Coragem" name="courage" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: 120 }} />
                                </Form.Item>
                                <Form.Item label="Velocidade" name="speed" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: 120 }} />
                                </Form.Item>
                                <Form.Item label="Sabedoria" name="wisdom" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: 120 }} />
                                </Form.Item>
                                <Form.Item label="Mujic" name="mugic" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: 120 }} />
                                </Form.Item>
                                <Form.Item label="Energia" name="energy" rules={[{ required: true }]}>
                                    <InputNumber min={0} style={{ width: 120 }} />
                                </Form.Item>
                            </Space>

                            <Form.Item
                                label="Elementos dominantes"
                                name="dominantElements"
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

                            <Form.Item label="Habilidades de suporte" name="supportAbilityId">
                                <Select
                                    mode="multiple"
                                    options={supportAbilityOptions}
                                    placeholder="Selecione habilidades support"
                                    optionFilterProp="label"
                                    showSearch
                                />
                            </Form.Item>

                            <Form.Item label="Habilidades brainwashed" name="brainwashedAbilityId">
                                <Select
                                    mode="multiple"
                                    options={brainwashedAbilityOptions}
                                    placeholder="Selecione habilidades brainwashed"
                                    optionFilterProp="label"
                                    showSearch
                                />
                            </Form.Item>

                            <Form.Item label="Equipamentos (anotação temporária)" name="equipmentNote">
                                <Input.TextArea rows={2} placeholder="Ex.: Em breve terá cadastro próprio" />
                            </Form.Item>

                            <Button onClick={onImportCreaturesFromJson} icon={importMutation.isPending ? <LoadingLogo /> : undefined} disabled={importMutation.isPending}>
                                Importar creatures.json
                            </Button>

                            <Button type="primary" htmlType="submit" icon={saveMutation.isPending ? <LoadingLogo /> : undefined} disabled={saveMutation.isPending}>
                                {editingCreatureId ? "Salvar edição" : "Cadastrar criatura"}
                            </Button>

                            {editingCreatureId ? (
                                <Button onClick={cancelEditCreature}>Cancelar edição</Button>
                            ) : null}
                        </Space>
                    </Form>
                </Card>

                <Card title="Criaturas cadastradas" style={{ borderRadius: 16 }}>
                    <SearchableDataTable<CreatureDto>
                        rowKey="id"
                        columns={columns}
                        dataSource={rows}
                        searchFields={["name", "rarity", "tribe"]}
                        searchPlaceholder="Buscar criatura por nome, raridade ou tribo"
                        pageSize={8}
                        scrollX={1000}
                    />
                </Card>
            </Space>
        </AdminShell>
    );
}
