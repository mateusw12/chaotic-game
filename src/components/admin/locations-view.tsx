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
import { ArrowLeftOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Link from "next/link";
import {
  CARD_RARITY_OPTIONS,
  CREATURE_ELEMENT_OPTIONS,
  CREATURE_TRIBE_OPTIONS,
  type CardRarity,
  type CreatureElement,
  type CreatureTribe,
} from "@/dto/creature";
import {
  LOCATION_INITIATIVE_ELEMENT_OPTIONS,
  LOCATION_BATTLE_ACTIONS,
  LOCATION_BATTLE_TRIGGER_EVENTS,
  LOCATION_BATTLE_TARGET_PLAYERS,
  LOCATION_BATTLE_RULE_TYPES,
  LOCATION_CARD_TYPE_OPTIONS,
  LOCATION_EFFECT_TYPE_OPTIONS,
  type LocationInitiativeElement,
  LOCATION_STAT_OPTIONS,
  LOCATION_TARGET_SCOPE_OPTIONS,
  type CreateLocationRequestDto,
  type LocationCardType,
  type LocationDto,
  type LocationEffectType,
  type LocationStat,
  type LocationTargetScope,
} from "@/dto/location";
import { AdminShell } from "@/components/admin/admin-shell";
import { LocationsAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { SearchableDataTable } from "@/components/shared/searchable-data-table";
import { LoadingLogo } from "@/components/shared/loading-logo";
import { useImageUploadField } from "@/hooks/use-image-upload-field";
import { useFormSubmitToast } from "@/hooks/use-form-submit-toast";

type LocationsViewProps = {
  locations: LocationDto[];
};

type LocationAbilityFormValues = {
  description: string;
  effectType: LocationEffectType;
  targetScope: LocationTargetScope;
  targetTribes: CreatureTribe[];
  stats: LocationStat[];
  cardTypes: LocationCardType[];
  value: number;
  battleRuleType?: string;
  battleRuleRequiresTarget?: boolean;
  battleRuleUsageLimitPerTurn?: number | null;
  battleRuleNotes?: string;
  battleRuleTrigger?: string;
  battleRuleTargetPlayer?: string;
  battleRuleAction?: string;
  battleRuleStat?: LocationStat;
  battleRuleKeyword?: string;
  battleRuleCondition?: string;
  battleRuleElement?: CreatureElement;
  battleRuleAmount?: number;
  battleRuleIncludesMinion?: boolean;
  battleRuleRequiresEmptySpace?: boolean;
};

type LocationFormValues = {
  name: string;
  rarity: CardRarity;
  imageFileId?: string;
  initiativeElements: LocationInitiativeElement[];
  tribes: CreatureTribe[];
  abilities: LocationAbilityFormValues[];
};

const { Title, Text } = Typography;

const BATTLE_RULE_TYPES_REQUIRING_AMOUNT = new Set<string>([
  "damage_on_activation",
  "lose_energy_on_element_loss",
  "gain_energy_on_element_gain",
  "gain_energy_per_element",
  "gain_mugic_counter_most_elements",
  "heal_on_elemental_attack",
  "damage_reduction_first_attack",
  "damage_reduction_lowest_power",
  "damage_reduction_shared_element",
  "stat_modifier",
  "stat_modifier_for_tribe",
  "stat_modifier_if_element",
  "stat_modifier_mirage",
  "minion_activated_ability_cost_increase",
  "discard_attack_cards_from_deck",
  "remove_mugic_counter_on_activate",
]);

const BATTLE_RULE_TYPES_REQUIRING_TRIGGER = new Set<string>([
  "damage_on_activation",
  "lose_energy_on_element_loss",
  "gain_energy_on_element_gain",
  "gain_energy_per_element",
  "gain_mugic_counter_most_elements",
  "gain_mugic_on_attack_reveal",
  "heal_on_elemental_attack",
  "move_mugic_counter_highest_wisdom",
  "sacrifice_battlegear_on_activate",
  "remove_mugic_counter_on_activate",
  "reveal_new_active_location",
  "relocate_to_empty_space_on_action_step",
  "return_chieftain_from_discard",
  "mugic_name_lock_this_turn",
  "discard_attack_cards_from_deck",
  "draw_then_discard_attack_cards",
]);

const BATTLE_RULE_TYPES_REQUIRING_ELEMENT = new Set<string>([
  "gain_element",
  "gain_element_and_keyword",
  "stat_modifier_if_element",
  "prevent_mugic_usage_without_element",
  "prevent_battlegear_flip_without_element",
]);

function buildBattleRulesFromForm(ability: LocationAbilityFormValues): CreateLocationRequestDto["abilities"][number]["battleRules"] {
  const type = (ability.battleRuleType?.trim() || "stat_modifier") as CreateLocationRequestDto["abilities"][number]["battleRules"] extends { type: infer T } ? T : never;

  const payload: Record<string, unknown> = {};

  if (ability.battleRuleTrigger) {
    payload.trigger = ability.battleRuleTrigger;
  }

  if (ability.battleRuleTargetPlayer) {
    payload.targetPlayer = ability.battleRuleTargetPlayer;
  }

  if (ability.battleRuleAction) {
    payload.action = ability.battleRuleAction;
  }

  if (ability.battleRuleStat) {
    payload.stat = ability.battleRuleStat;
  }

  if (ability.battleRuleKeyword?.trim()) {
    payload.keyword = ability.battleRuleKeyword.trim();
  }

  if (ability.battleRuleCondition?.trim()) {
    payload.condition = ability.battleRuleCondition.trim();
  }

  if (ability.battleRuleElement) {
    payload.element = ability.battleRuleElement;
  }

  if (typeof ability.battleRuleAmount === "number") {
    payload.amount = ability.battleRuleAmount;
  }

  if (ability.battleRuleIncludesMinion) {
    payload.includesMinion = true;
  }

  if (ability.battleRuleRequiresEmptySpace) {
    payload.requiresEmptySpace = true;
  }

  return {
    type,
    requiresTarget: ability.battleRuleRequiresTarget ?? ability.targetScope !== "none",
    usageLimitPerTurn: ability.battleRuleUsageLimitPerTurn ?? null,
    notes: ability.battleRuleNotes?.trim() || null,
    payload: Object.keys(payload).length > 0 ? payload : null,
  };
}

function mapBattleRulesToForm(ability: LocationDto["abilities"][number]): LocationAbilityFormValues {
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
    battleRuleType: rule?.type ?? "stat_modifier",
    battleRuleRequiresTarget: rule?.requiresTarget ?? ability.targetScope !== "none",
    battleRuleUsageLimitPerTurn: rule?.usageLimitPerTurn ?? null,
    battleRuleNotes: rule?.notes ?? "",
    battleRuleTrigger: typeof payload?.trigger === "string" ? payload.trigger : undefined,
    battleRuleTargetPlayer: typeof payload?.targetPlayer === "string" ? payload.targetPlayer : undefined,
    battleRuleAction: typeof payload?.action === "string" ? payload.action : undefined,
    battleRuleStat: typeof payload?.stat === "string" ? payload.stat as LocationStat : undefined,
    battleRuleKeyword: typeof payload?.keyword === "string" ? payload.keyword : undefined,
    battleRuleCondition: typeof payload?.condition === "string" ? payload.condition : undefined,
    battleRuleElement: typeof payload?.element === "string" ? payload.element as CreatureElement : undefined,
    battleRuleAmount: typeof payload?.amount === "number" ? payload.amount : undefined,
    battleRuleIncludesMinion: payload?.includesMinion === true,
    battleRuleRequiresEmptySpace: payload?.requiresEmptySpace === true,
  };
}

export function LocationsView({ locations }: LocationsViewProps) {
  const { notification } = AntdApp.useApp();
  const { runWithSubmitToast } = useFormSubmitToast(notification);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<LocationFormValues>();
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const batchImageInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isUploading: isImageUploading,
    previewUrl: imagePreviewUrl,
    fileList: imageFileList,
    attachFile: attachImageFile,
    clearImage,
    setExistingImage,
  } = useImageUploadField({
    messageApi: notification,
    form,
    fieldName: "imageFileId",
    uploadFile: (formData) => LocationsAdminService.uploadImage(formData),
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
    queryKey: adminQueryKeys.locations,
    queryFn: () => LocationsAdminService.getAll(),
    initialData: locations,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: CreateLocationRequestDto }) =>
      id ? LocationsAdminService.update(id, payload) : LocationsAdminService.create(payload),
  });

  const importMutation = useMutation({
    mutationFn: () => LocationsAdminService.importFromJson(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => LocationsAdminService.remove(id),
  });

  const importImagesMutation = useMutation({
    mutationFn: (formData: FormData) => LocationsAdminService.importImages(formData),
  });

  async function onSubmit(values: LocationFormValues) {
    try {
      const payload: CreateLocationRequestDto = {
        name: values.name,
        rarity: values.rarity,
        imageFileId: values.imageFileId ?? null,
        initiativeElements: values.initiativeElements,
        tribes: values.tribes,
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

      const isEditing = Boolean(editingLocationId);
      await runWithSubmitToast(
        async () => {
          await saveMutation.mutateAsync({
            id: editingLocationId,
            payload,
          });
          await queryClient.invalidateQueries({ queryKey: adminQueryKeys.locations });

          setEditingLocationId(null);
          form.resetFields();
          clearImage();
        },
        {
          successMessage: isEditing ? "Local atualizado com sucesso." : "Local cadastrado com sucesso.",
          defaultErrorMessage: "Erro ao salvar local.",
        },
      );
    } catch (error) {
      notification.error({ title: error instanceof Error ? error.message : "Erro ao salvar local." });
    }
  }

  const startEdit = useCallback((location: LocationDto) => {
    setEditingLocationId(location.id);
    form.setFieldsValue({
      name: location.name,
      rarity: location.rarity,
      imageFileId: location.imageFileId ?? undefined,
      initiativeElements: location.initiativeElements,
      tribes: location.tribes,
      abilities: location.abilities.map((ability) => mapBattleRulesToForm(ability)),
    });

    setExistingImage({
      url: location.imageUrl,
      uid: location.id,
      name: "imagem-atual",
    });
  }, [form, setExistingImage]);

  function cancelEdit() {
    setEditingLocationId(null);
    form.resetFields();
    clearImage();
  }

  const onDelete = useCallback(async (locationId: string) => {
    setDeletingLocationId(locationId);

    try {
      await runWithSubmitToast(
        async () => {
          await deleteMutation.mutateAsync(locationId);
          await queryClient.invalidateQueries({ queryKey: adminQueryKeys.locations });
        },
        {
          successMessage: "Local removido com sucesso.",
          defaultErrorMessage: "Erro ao remover local.",
        },
      );
    } finally {
      setDeletingLocationId(null);
    }
  }, [deleteMutation, queryClient, runWithSubmitToast]);

  const onImportLocationsFromJson = useCallback(async () => {
    try {
      const result = await importMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.locations });

      notification.success({ title: `${result.fileName}: ${result.imported} importada(s), ${result.updated} atualizada(s), ${result.skipped} ignorada(s).` });
    } catch (error) {
      notification.error({
        title: error instanceof Error
          ? error.message
          : "Erro ao importar locais do JSON.",
      });
    }
  }, [importMutation, notification, queryClient]);

  const onImportLocationImages = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const result = await importImagesMutation.mutateAsync(formData);
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.locations });

      const extraInfo = [
        result.unmatchedFiles && result.unmatchedFiles.length > 0
          ? `Sem match: ${result.unmatchedFiles.length}`
          : null,
        result.failedFiles && result.failedFiles.length > 0
          ? `Falhas: ${result.failedFiles.length}`
          : null,
      ].filter(Boolean).join(" | ");

      notification.success({
        title: `${result.updated} local(is) atualizado(s), ${result.uploaded} upload(s), ${result.skipped} ignorado(s).${extraInfo ? ` ${extraInfo}` : ""}`,
      });
    } catch (error) {
      notification.error({
        title:
          error instanceof Error
            ? error.message
            : "Erro ao importar imagens de locais.",
      });
    }
  }, [importImagesMutation, notification, queryClient]);

  const onBatchImageInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    void onImportLocationImages(files);
  }, [onImportLocationImages]);

  const columns = useMemo<ColumnsType<LocationDto>>(
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
        title: "Initiative",
        key: "initiativeElements",
        render: (_, row) => (
          <Space wrap>
            {row.initiativeElements.map((element) => {
              const option = LOCATION_INITIATIVE_ELEMENT_OPTIONS.find((item) => item.value === element);
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
              const targetScopeLabel =
                LOCATION_TARGET_SCOPE_OPTIONS.find((item) => item.value === ability.targetScope)?.label
                ?? ability.targetScope;
              const targetTribesLabel = ability.targetTribes.length > 0
                ? ability.targetTribes.map((tribe) => CREATURE_TRIBE_OPTIONS.find((item) => item.value === tribe)?.label ?? tribe).join(", ")
                : "-";

              return (
                <Tag key={`${row.id}-ability-${index}`} color={ability.effectType === "increase" ? "green" : "volcano"}>
                  {ability.description} • {effectLabel} {ability.value} em {statLabel} ({cardTypesLabel}) • Alvo: {targetScopeLabel} {targetTribesLabel !== "-" ? `• Tribos: ${targetTribesLabel}` : ""} • Regra: {ability.battleRules?.type ?? "stat_modifier"}
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
              <Button size="small" danger icon={deletingLocationId === row.id ? <LoadingLogo /> : undefined} disabled={deletingLocationId === row.id}>
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

            <Space>
              <Button onClick={() => void onImportLocationsFromJson()} icon={importMutation.isPending ? <LoadingLogo /> : undefined} disabled={importMutation.isPending}>
                Importar locations.json
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
              <Link href="/">
                <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
              </Link>
            </Space>
          </Space>
        </Card>

        <Card title="Novo local" style={{ borderRadius: 16 }}>
          <Form<LocationFormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
              rarity: "comum",
              initiativeElements: [],
              tribes: [],
              abilities: [{
                description: "",
                effectType: "increase",
                targetScope: "all_creatures",
                targetTribes: [],
                stats: ["speed"],
                cardTypes: [],
                value: 0,
                battleRuleType: "stat_modifier",
                battleRuleRequiresTarget: true,
                battleRuleUsageLimitPerTurn: null,
                battleRuleNotes: "",
                battleRuleIncludesMinion: false,
                battleRuleRequiresEmptySpace: false,
              }],
            }}
          >
            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
              <Form.Item label="Nome" name="name" rules={[{ required: true, message: "Informe o nome do local." }]}>
                <Input placeholder="Ex.: Lago de Mipedim" />
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
                  options={LOCATION_INITIATIVE_ELEMENT_OPTIONS.map((item) => ({
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
                              label="Escopo do alvo"
                              name={[field.name, "targetScope"]}
                              rules={[{ required: true, message: "Selecione o escopo." }]}
                            >
                              <Select
                                style={{ width: 220 }}
                                options={LOCATION_TARGET_SCOPE_OPTIONS.map((item) => ({
                                  value: item.value,
                                  label: item.label,
                                }))}
                              />
                            </Form.Item>

                            <Form.Item
                              label="Tribos alvo (opcional)"
                              name={[field.name, "targetTribes"]}
                              dependencies={[["abilities", field.name, "targetScope"]]}
                              rules={[
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    const targetScope = getFieldValue(["abilities", field.name, "targetScope"]);

                                    if (targetScope !== "specific_tribes") {
                                      return Promise.resolve();
                                    }

                                    if (Array.isArray(value) && value.length > 0) {
                                      return Promise.resolve();
                                    }

                                    return Promise.reject(new Error("Selecione ao menos 1 tribo para escopo de tribos específicas."));
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
                                placeholder="Use com escopo tribos"
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

                          <Card size="small" title="Regras de batalha">
                            <Space wrap size={12}>
                              <Form.Item
                                label="Tipo da regra"
                                name={[field.name, "battleRuleType"]}
                                rules={[{ required: true, message: "Selecione o tipo da regra." }]}
                              >
                                <Select
                                  style={{ width: 260 }}
                                  options={LOCATION_BATTLE_RULE_TYPES.map((type) => ({ value: type, label: type }))}
                                  placeholder="Selecione"
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
                                label="Gatilho"
                                name={[field.name, "battleRuleTrigger"]}
                                dependencies={[["abilities", field.name, "battleRuleType"]]}
                                rules={[
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      const battleRuleType = getFieldValue(["abilities", field.name, "battleRuleType"]);

                                      if (!BATTLE_RULE_TYPES_REQUIRING_TRIGGER.has(String(battleRuleType ?? ""))) {
                                        return Promise.resolve();
                                      }

                                      if (typeof value === "string" && value.trim().length > 0) {
                                        return Promise.resolve();
                                      }

                                      return Promise.reject(new Error("Selecione o gatilho para esse tipo de regra."));
                                    },
                                  }),
                                ]}
                              >
                                <Select
                                  allowClear
                                  style={{ width: 220 }}
                                  options={LOCATION_BATTLE_TRIGGER_EVENTS.map((value) => ({ value, label: value }))}
                                  placeholder="Opcional"
                                />
                              </Form.Item>

                              <Form.Item
                                label="Jogador alvo"
                                name={[field.name, "battleRuleTargetPlayer"]}
                              >
                                <Select
                                  allowClear
                                  style={{ width: 220 }}
                                  options={LOCATION_BATTLE_TARGET_PLAYERS.map((value) => ({ value, label: value }))}
                                  placeholder="Opcional"
                                />
                              </Form.Item>

                              <Form.Item
                                label="Ação"
                                name={[field.name, "battleRuleAction"]}
                              >
                                <Select
                                  allowClear
                                  style={{ width: 220 }}
                                  options={LOCATION_BATTLE_ACTIONS.map((value) => ({ value, label: value }))}
                                  placeholder="Opcional"
                                />
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
                                label="Keyword"
                                name={[field.name, "battleRuleKeyword"]}
                              >
                                <Input style={{ width: 220 }} placeholder="Opcional" />
                              </Form.Item>

                              <Form.Item
                                label="Condição"
                                name={[field.name, "battleRuleCondition"]}
                              >
                                <Input style={{ width: 220 }} placeholder="Opcional" />
                              </Form.Item>

                              <Form.Item
                                label="Elemento"
                                name={[field.name, "battleRuleElement"]}
                                dependencies={[["abilities", field.name, "battleRuleType"]]}
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

                                      return Promise.reject(new Error("Selecione o elemento para esse tipo de regra."));
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
                                dependencies={[["abilities", field.name, "battleRuleType"]]}
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

                                      return Promise.reject(new Error("Informe a quantidade (mínimo 0) para esse tipo de regra."));
                                    },
                                  }),
                                ]}
                              >
                                <InputNumber min={0} style={{ width: 150 }} placeholder="Opcional" />
                              </Form.Item>

                              <Form.Item
                                label="Inclui Minion"
                                name={[field.name, "battleRuleIncludesMinion"]}
                                valuePropName="checked"
                              >
                                <Switch />
                              </Form.Item>

                              <Form.Item
                                label="Requer espaço vazio"
                                name={[field.name, "battleRuleRequiresEmptySpace"]}
                                valuePropName="checked"
                              >
                                <Switch />
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

                    <Button onClick={() => add({
                      description: "",
                      effectType: "increase",
                      targetScope: "all_creatures",
                      targetTribes: [],
                      stats: ["speed"],
                      cardTypes: [],
                      value: 0,
                      battleRuleType: "stat_modifier",
                      battleRuleRequiresTarget: true,
                      battleRuleUsageLimitPerTurn: null,
                      battleRuleNotes: "",
                      battleRuleIncludesMinion: false,
                      battleRuleRequiresEmptySpace: false,
                    })}>
                      Adicionar habilidade
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Button type="primary" htmlType="submit" icon={saveMutation.isPending ? <LoadingLogo /> : undefined} disabled={saveMutation.isPending}>
                {editingLocationId ? "Salvar edição" : "Cadastrar local"}
              </Button>

              {editingLocationId ? <Button onClick={cancelEdit}>Cancelar edição</Button> : null}
            </Space>
          </Form>
        </Card>

        <Card title="Locais cadastrados" style={{ borderRadius: 16 }}>
          <SearchableDataTable<LocationDto>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            searchFields={["name", "rarity"]}
            searchPlaceholder="Buscar local por nome ou raridade"
            pageSize={8}
            scrollX={1000}
          />
        </Card>
      </Space>
    </AdminShell>
  );
}
