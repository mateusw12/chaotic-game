"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  Switch,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { ArrowLeftOutlined, ToolOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
  CARD_RARITY_OPTIONS,
  CREATURE_ELEMENT_OPTIONS,
  CREATURE_TRIBE_OPTIONS,
  type CardRarity,
  type CreatureDto,
  type CreatureElement,
  type CreatureTribe,
} from "@/dto/creature";
import {
  LOCATION_CARD_TYPE_OPTIONS,
  LOCATION_STAT_OPTIONS,
  type LocationCardType,
  type LocationStat,
} from "@/dto/location";
import {
  BATTLEGEAR_BATTLE_RULE_TYPES,
  BATTLEGEAR_EFFECT_TYPE_OPTIONS,
  BATTLEGEAR_TARGET_SCOPE_OPTIONS,
  type BattleGearBattleRuleDto,
  type BattleGearDto,
  type BattleGearEffectType,
  type BattleGearTargetScope,
  type CreateBattleGearRequestDto,
} from "@/dto/battlegear";
import { AdminShell } from "@/components/admin/admin-shell";
import { BattleGearAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { SearchableDataTable } from "@/components/shared/searchable-data-table";
import { LoadingLogo } from "@/components/shared/loading-logo";

type BattleGearViewProps = {
  battlegear: BattleGearDto[];
  creatures: CreatureDto[];
};

type BattleGearAbilityFormValues = {
  description: string;
  effectType: BattleGearEffectType;
  targetScope: BattleGearTargetScope;
  targetTribes: CreatureTribe[];
  stats: LocationStat[];
  cardTypes: LocationCardType[];
  value: number;
  battleRuleType?: string;
  battleRuleRequiresTarget?: boolean;
  battleRuleUsageLimitPerTurn?: number | null;
  battleRuleNotes?: string;
  battleRuleStat?: LocationStat;
  battleRuleElement?: CreatureElement;
  battleRuleAmount?: number;
  battleRuleKeyword?: string;
};

type BattleGearFormValues = {
  name: string;
  rarity: CardRarity;
  imageFileId?: string;
  allowedTribes: CreatureTribe[];
  allowedCreatureIds: string[];
  abilities: BattleGearAbilityFormValues[];
};

const BATTLE_RULE_TYPES_REQUIRING_AMOUNT = new Set<string>([
  "additional_damage_to_no_element_creatures",
  "expend_element_for_stat",
  "gain_energy_on_opponent_fail_check",
  "gain_energy_with_element_bonus",
  "destroy_battlegear_on_damage_threshold",
  "sacrifice_for_mugic_and_heal",
  "sacrifice_for_damage_with_bonus",
  "redirect_damage_option",
  "additional_damage_if_has_element",
  "damage_cap",
]);

const BATTLE_RULE_TYPES_REQUIRING_ELEMENT = new Set<string>([
  "expend_element_for_stat",
  "gain_element_on_engage",
  "gain_energy_with_element_bonus",
  "destroy_battlegear_on_damage_threshold",
  "gain_element_and_bonus_for_specific_creature",
  "sacrifice_for_mugic_and_heal",
  "sacrifice_for_damage_with_bonus",
  "gain_keyword_with_element_bonus",
  "redirect_damage_option",
  "additional_damage_if_has_element",
]);

function buildBattleRulesFromForm(ability: BattleGearAbilityFormValues): BattleGearBattleRuleDto | null {
  if (!ability.battleRuleType) {
    return null;
  }

  const payload: Record<string, unknown> = {};

  if (ability.battleRuleStat) {
    payload.stat = ability.battleRuleStat;
  }

  if (ability.battleRuleElement) {
    payload.element = ability.battleRuleElement;
  }

  if (typeof ability.battleRuleAmount === "number") {
    payload.amount = ability.battleRuleAmount;
  }

  if (ability.battleRuleKeyword?.trim()) {
    payload.keyword = ability.battleRuleKeyword.trim();
  }

  return {
    type: ability.battleRuleType as BattleGearBattleRuleDto["type"],
    requiresTarget: ability.battleRuleRequiresTarget ?? ability.targetScope !== "none",
    usageLimitPerTurn: ability.battleRuleUsageLimitPerTurn ?? null,
    notes: ability.battleRuleNotes?.trim() || null,
    payload: Object.keys(payload).length > 0 ? payload : null,
  };
}

function mapBattleRulesToForm(ability: BattleGearDto["abilities"][number]): BattleGearAbilityFormValues {
  const rule = ability.battleRules;
  const payload = (rule?.payload && typeof rule.payload === "object" && !Array.isArray(rule.payload))
    ? rule.payload as Record<string, unknown>
    : null;

  return {
    description: ability.description,
    effectType: ability.effectType,
    targetScope: ability.targetScope,
    targetTribes: ability.targetTribes,
    stats: ability.stats,
    cardTypes: ability.cardTypes,
    value: ability.value,
    battleRuleType: rule?.type,
    battleRuleRequiresTarget: rule?.requiresTarget ?? ability.targetScope !== "none",
    battleRuleUsageLimitPerTurn: rule?.usageLimitPerTurn ?? null,
    battleRuleNotes: rule?.notes ?? "",
    battleRuleStat: typeof payload?.stat === "string" ? payload.stat as LocationStat : undefined,
    battleRuleElement: typeof payload?.element === "string" ? payload.element as CreatureElement : undefined,
    battleRuleAmount: typeof payload?.amount === "number" ? payload.amount : undefined,
    battleRuleKeyword: typeof payload?.keyword === "string" ? payload.keyword : undefined,
  };
}

const { Title, Text } = Typography;

export function BattleGearView({ battlegear, creatures }: BattleGearViewProps) {
  const { notification } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<BattleGearFormValues>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const batchImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: adminQueryKeys.battlegear,
    queryFn: () => BattleGearAdminService.getAll(),
    initialData: battlegear,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: CreateBattleGearRequestDto }) =>
      id ? BattleGearAdminService.update(id, payload) : BattleGearAdminService.create(payload),
  });

  const importMutation = useMutation({
    mutationFn: () => BattleGearAdminService.importFromJson(),
  });

  const importImagesMutation = useMutation({
    mutationFn: (formData: FormData) => BattleGearAdminService.importImages(formData),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => BattleGearAdminService.remove(id),
  });

  const syncImagesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/battlegear/sync-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Falha ao sincronizar imagens");
      }

      return response.json();
    },
  });

  const creatureOptions = useMemo(
    () => creatures.map((creature) => ({ value: creature.id, label: creature.name })),
    [creatures],
  );

  async function attachImageFile(file: File & { uid?: string }) {
    setIsImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await BattleGearAdminService.uploadImage(formData);

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

      notification.success({ title: "Imagem enviada para o Storage com sucesso." });
    } catch (error) {
      notification.error({ title: error instanceof Error ? error.message : "Erro ao anexar imagem." });
    } finally {
      setIsImageUploading(false);
    }
  }

  async function onSubmit(values: BattleGearFormValues) {
    try {
      const payload: CreateBattleGearRequestDto = {
        name: values.name,
        rarity: values.rarity,
        imageFileId: values.imageFileId ?? null,
        allowedTribes: values.allowedTribes,
        allowedCreatureIds: values.allowedCreatureIds,
        abilities: values.abilities.map((ability) => ({
          description: ability.description,
          effectType: ability.effectType,
          targetScope: ability.targetScope,
          targetTribes: ability.targetTribes,
          stats: ability.stats,
          cardTypes: ability.cardTypes,
          value: ability.value,
          battleRules: buildBattleRulesFromForm(ability),
        })),
      };

      const isEditing = Boolean(editingId);
      await saveMutation.mutateAsync({ id: editingId, payload });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.battlegear });

      setEditingId(null);
      form.resetFields();
      setImageFileList([]);
      setImagePreviewUrl(null);
      notification.success({ title: isEditing ? "Equipamento atualizado com sucesso." : "Equipamento cadastrado com sucesso." });
    } catch (error) {
      notification.error({ title: error instanceof Error ? error.message : "Erro ao salvar equipamento." });
    }
  }

  const startEdit = useCallback((item: BattleGearDto) => {
    setEditingId(item.id);
    form.setFieldsValue({
      name: item.name,
      rarity: item.rarity,
      imageFileId: item.imageFileId ?? undefined,
      allowedTribes: item.allowedTribes,
      allowedCreatureIds: item.allowedCreatureIds,
      abilities: item.abilities.map((ability) => mapBattleRulesToForm(ability)),
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
      await deleteMutation.mutateAsync(itemId);
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.battlegear });
      notification.success({ title: "Equipamento removido com sucesso." });
    } catch (error) {
      notification.error({ title: error instanceof Error ? error.message : "Erro ao remover equipamento." });
    } finally {
      setDeletingId(null);
    }
  }, [deleteMutation, notification, queryClient]);

  const onImportBattlegearFromJson = useCallback(async () => {
    try {
      const result = await importMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.battlegear });

      notification.success({ title: `${result.fileName}: ${result.imported} importado(s), ${result.updated} atualizado(s), ${result.skipped} ignorado(s).` });
    } catch (error) {
      notification.error({
        title: error instanceof Error
          ? error.message
          : "Erro ao importar equipamentos do JSON.",
      });
    }
  }, [importMutation, notification, queryClient]);

  const onImportBattleGearImages = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const result = await importImagesMutation.mutateAsync(formData);
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.battlegear });

      const extraInfo = [
        result.unmatchedFiles && result.unmatchedFiles.length > 0
          ? `Sem match: ${result.unmatchedFiles.length}`
          : null,
        result.failedFiles && result.failedFiles.length > 0
          ? `Falhas: ${result.failedFiles.length}`
          : null,
      ].filter(Boolean).join(" | ");

      notification.success({
        title: `${result.updated} equipamento(s) atualizado(s), ${result.uploaded} upload(s), ${result.skipped} ignorado(s).${extraInfo ? ` ${extraInfo}` : ""}`,
      });
    } catch (error) {
      notification.error({
        title:
          error instanceof Error
            ? error.message
            : "Erro ao importar imagens de equipamentos.",
      });
    }
  }, [importImagesMutation, notification, queryClient]);

  const onBatchImageInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    void onImportBattleGearImages(files);
  }, [onImportBattleGearImages]);

  const columns = useMemo<ColumnsType<BattleGearDto>>(
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
        title: "Restrições",
        key: "restrictions",
        render: (_, row) => (
          <Space orientation="vertical" size={4}>
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
          <Space orientation="vertical" size={6}>
            {row.abilities.length === 0 ? <Text type="secondary">Sem habilidades</Text> : null}
            {row.abilities.map((ability, index) => {
              const effectLabel =
                BATTLEGEAR_EFFECT_TYPE_OPTIONS.find((item) => item.value === ability.effectType)?.label
                ?? ability.effectType;
              const statLabel =
                ability.stats.length === 0
                  ? "-"
                  : ability.stats
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
                  {ability.description} • {effectLabel} {ability.value} em {statLabel} ({cardTypesLabel}) • Alvo: {ability.targetScope} • Regra: {ability.battleRules?.type ?? "-"}
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
              <Button size="small" danger icon={deletingId === row.id ? <LoadingLogo /> : undefined} disabled={deletingId === row.id}>
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
      <Space orientation="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <Card style={{ borderRadius: 16 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <ToolOutlined />
              <Title level={3} style={{ margin: 0 }}>
                Cadastro de Equipamento de Batalha
              </Title>
            </Space>

            <Space>
              <Button onClick={() => void onImportBattlegearFromJson()} icon={importMutation.isPending ? <LoadingLogo /> : undefined} disabled={importMutation.isPending}>
                Importar battlegear.json
              </Button>
              <input
                ref={batchImageInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={onBatchImageInputChange}
              />
              <Button
                onClick={() => batchImageInputRef.current?.click()}
                icon={importImagesMutation.isPending ? <LoadingLogo /> : undefined}
                disabled={importImagesMutation.isPending}
              >
                Importar imagens em lote
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const result = await syncImagesMutation.mutateAsync();
                    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.battlegear });
                    notification.success({ message: `Sincronização: ${result.processed} processados, ${result.renamed} renomeados` });
                  } catch (err) {
                    notification.error({ message: err instanceof Error ? err.message : "Erro ao sincronizar imagens" });
                  }
                }}
                icon={syncImagesMutation.isPending ? <LoadingLogo /> : undefined}
                disabled={syncImagesMutation.isPending}
              >
                Sincronizar imagens
              </Button>
              <Link href="/">
                <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
              </Link>
            </Space>
          </Space>
        </Card>

        <Card title="Novo equipamento" style={{ borderRadius: 16 }}>
          <Form<BattleGearFormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
              rarity: "comum",
              allowedTribes: [],
              allowedCreatureIds: [],
              abilities: [{
                description: "",
                effectType: "increase",
                targetScope: "all_creatures",
                targetTribes: [],
                stats: ["speed"],
                cardTypes: ["creature"],
                value: 0,
                battleRuleType: undefined,
                battleRuleRequiresTarget: true,
                battleRuleUsageLimitPerTurn: null,
                battleRuleNotes: "",
              }],
            }}
          >
            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
              <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome do equipamento." }]}>
                <Input placeholder="Ex.: Battle Gear de Mipedim" />
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
                  <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                    <Text strong>Habilidades do equipamento</Text>
                    {fields.map((field) => (
                      <Card key={field.key} size="small" style={{ borderRadius: 12 }}>
                        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
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
                                options={BATTLEGEAR_EFFECT_TYPE_OPTIONS.map((item) => ({
                                  value: item.value,
                                  label: item.label,
                                }))}
                              />
                            </Form.Item>

                            <Form.Item
                              label="Escopo"
                              name={[field.name, "targetScope"]}
                              rules={[{ required: true, message: "Selecione o escopo." }]}
                            >
                              <Select
                                style={{ width: 220 }}
                                options={BATTLEGEAR_TARGET_SCOPE_OPTIONS.map((item) => ({
                                  value: item.value,
                                  label: item.label,
                                }))}
                              />
                            </Form.Item>

                            <Form.Item
                              label="Tribos alvo"
                              name={[field.name, "targetTribes"]}
                              dependencies={["abilities", field.name, "targetScope"]}
                              rules={[
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    const scope = getFieldValue(["abilities", field.name, "targetScope"]);

                                    if (scope !== "specific_tribes") {
                                      return Promise.resolve();
                                    }

                                    if (Array.isArray(value) && value.length > 0) {
                                      return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("Selecione ao menos uma tribo para escopo por tribo."));
                                  },
                                }),
                              ]}
                            >
                              <Select
                                mode="multiple"
                                style={{ width: 220 }}
                                options={CREATURE_TRIBE_OPTIONS.map((item) => ({
                                  value: item.value,
                                  label: item.label,
                                }))}
                                placeholder="Opcional"
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

                          <Card size="small" title="Regras de batalha">
                            <Space wrap size={12}>
                              <Form.Item
                                label="Tipo da regra"
                                name={[field.name, "battleRuleType"]}
                              >
                                <Select
                                  allowClear
                                  style={{ width: 260 }}
                                  options={BATTLEGEAR_BATTLE_RULE_TYPES.map((type) => ({ value: type, label: type }))}
                                  placeholder="Opcional"
                                />
                              </Form.Item>

                              <Form.Item
                                label="Exige alvo"
                                name={[field.name, "battleRuleRequiresTarget"]}
                                valuePropName="checked"
                              >
                                <Switch />
                              </Form.Item>

                              <Form.Item
                                label="Limite por turno"
                                name={[field.name, "battleRuleUsageLimitPerTurn"]}
                              >
                                <InputNumber min={0} style={{ width: 160 }} placeholder="Opcional" />
                              </Form.Item>

                              <Form.Item
                                label="Atributo da regra"
                                name={[field.name, "battleRuleStat"]}
                              >
                                <Select
                                  allowClear
                                  style={{ width: 200 }}
                                  options={LOCATION_STAT_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                  placeholder="Opcional"
                                />
                              </Form.Item>

                              <Form.Item
                                label="Elemento"
                                name={[field.name, "battleRuleElement"]}
                                dependencies={["abilities", field.name, "battleRuleType"]}
                                rules={[
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      const battleRuleType = getFieldValue(["abilities", field.name, "battleRuleType"]);

                                      if (!BATTLE_RULE_TYPES_REQUIRING_ELEMENT.has(String(battleRuleType ?? ""))) {
                                        return Promise.resolve();
                                      }

                                      if (typeof value === "string" && value.trim().length > 0) {
                                        return Promise.resolve();
                                      }

                                      return Promise.reject(new Error("Informe o elemento para esse tipo de regra."));
                                    },
                                  }),
                                ]}
                              >
                                <Select
                                  allowClear
                                  style={{ width: 180 }}
                                  options={CREATURE_ELEMENT_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                                  placeholder="Opcional"
                                />
                              </Form.Item>

                              <Form.Item
                                label="Quantidade"
                                name={[field.name, "battleRuleAmount"]}
                                dependencies={["abilities", field.name, "battleRuleType"]}
                                rules={[
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      const battleRuleType = getFieldValue(["abilities", field.name, "battleRuleType"]);

                                      if (!BATTLE_RULE_TYPES_REQUIRING_AMOUNT.has(String(battleRuleType ?? ""))) {
                                        return Promise.resolve();
                                      }

                                      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
                                        return Promise.resolve();
                                      }

                                      return Promise.reject(new Error("Informe a quantidade (mínimo 0)."));
                                    },
                                  }),
                                ]}
                              >
                                <InputNumber min={0} style={{ width: 150 }} placeholder="Opcional" />
                              </Form.Item>

                              <Form.Item
                                label="Keyword"
                                name={[field.name, "battleRuleKeyword"]}
                              >
                                <Input style={{ width: 220 }} placeholder="Opcional" />
                              </Form.Item>
                            </Space>

                            <Form.Item
                              label="Notas da regra"
                              name={[field.name, "battleRuleNotes"]}
                            >
                              <Input.TextArea rows={2} placeholder="Opcional" />
                            </Form.Item>
                          </Card>
                        </Space>
                      </Card>
                    ))}

                    <Button
                      onClick={() => add({
                        description: "",
                        effectType: "increase",
                        targetScope: "all_creatures",
                        targetTribes: [],
                        stats: ["speed"],
                        cardTypes: ["creature"],
                        value: 0,
                        battleRuleType: undefined,
                        battleRuleRequiresTarget: true,
                        battleRuleUsageLimitPerTurn: null,
                        battleRuleNotes: "",
                      })}
                    >
                      Adicionar habilidade
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Button type="primary" htmlType="submit" icon={saveMutation.isPending ? <LoadingLogo /> : undefined} disabled={saveMutation.isPending}>
                {editingId ? "Salvar edição" : "Cadastrar equipamento"}
              </Button>

              {editingId ? <Button onClick={cancelEdit}>Cancelar edição</Button> : null}
            </Space>
          </Form>
        </Card>

        <Card title="Equipamentos cadastrados" style={{ borderRadius: 16 }}>
          <SearchableDataTable<BattleGearDto>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            searchFields={["name", "rarity"]}
            searchPlaceholder="Buscar equipamento por nome ou raridade"
            pageSize={8}
            scrollX={1200}
          />
        </Card>
      </Space>
    </AdminShell>
  );
}
