"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App as AntdApp,
  Button,
  Card,
  DatePicker,
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
import { ArrowLeftOutlined, TrophyOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import Link from "next/link";
import { CREATURE_TRIBE_OPTIONS, type CreatureTribe } from "@/dto/creature";
import {
  TOURNAMENT_FORMAT_OPTIONS,
  TOURNAMENT_LOCATION_MODE_OPTIONS,
  TOURNAMENT_SCHEDULE_TYPE_OPTIONS,
  type CreateTournamentRequestDto,
  type TournamentDto,
  type TournamentFormat,
  type TournamentLocationMode,
  type TournamentScheduleType,
} from "@/dto/tournament";
import { AdminShell } from "@/components/admin/admin-shell";
import { TournamentsAdminService } from "@/lib/api/service";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { SearchableDataTable } from "@/components/shared/searchable-data-table/searchable-data-table";
import { LoadingLogo } from "@/components/shared/loading-logo/loading-logo";
import { useImageUploadField } from "@/hooks/use-image-upload-field";
import { useFormSubmitToast } from "@/hooks/use-form-submit-toast";

type TournamentsViewProps = {
  tournaments: TournamentDto[];
};

type TournamentFormValues = {
  name: string;
  coverImageFileId?: string;
  cardsCount: number;
  playersCount: number;
  allowedFormats: TournamentFormat[];
  deckArchetypes: string[];
  maxCardEnergy?: number;
  allowedTribes: CreatureTribe[];
  allowMugic: boolean;
  locationMode: TournamentLocationMode;
  definedLocations: string[];
  additionalRules?: string;
  scheduleType: TournamentScheduleType;
  startAt?: Dayjs;
  endAt?: Dayjs;
  periodDays?: number;
  isEnabled: boolean;
};

const { Title, Text } = Typography;

function scheduleLabel(tournament: TournamentDto): string {
  if (tournament.scheduleType === "date_range") {
    const startLabel = tournament.startAt ? dayjs(tournament.startAt).format("DD/MM/YYYY HH:mm") : "-";
    const endLabel = tournament.endAt ? dayjs(tournament.endAt).format("DD/MM/YYYY HH:mm") : "-";
    return `${startLabel} → ${endLabel}`;
  }

  return `A cada ${tournament.periodDays ?? "-"} dias`;
}

export function TournamentsView({ tournaments }: TournamentsViewProps) {
  const { notification } = AntdApp.useApp();
  const { runWithSubmitToast } = useFormSubmitToast(notification);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<TournamentFormValues>();
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);

  const {
    isUploading: isCoverUploading,
    previewUrl: coverPreviewUrl,
    fileList: coverFileList,
    attachFile: attachCoverFile,
    clearImage: clearCover,
    setExistingImage: setExistingCover,
  } = useImageUploadField({
    messageApi: notification,
    form,
    fieldName: "coverImageFileId",
    uploadFile: (formData) => TournamentsAdminService.uploadCover(formData),
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
    successMessage: "Capa enviada com sucesso.",
    defaultErrorMessage: "Erro ao enviar capa.",
  });

  const { data: rows = [] } = useQuery({
    queryKey: adminQueryKeys.tournaments,
    queryFn: () => TournamentsAdminService.getAll(),
    initialData: tournaments,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: CreateTournamentRequestDto }) =>
      id ? TournamentsAdminService.update(id, payload) : TournamentsAdminService.create(payload),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TournamentsAdminService.remove(id),
  });

  async function onSubmit(values: TournamentFormValues) {
    const payload: CreateTournamentRequestDto = {
      name: values.name,
      coverImageFileId: values.coverImageFileId ?? null,
      cardsCount: values.cardsCount,
      playersCount: values.playersCount,
      allowedFormats: values.allowedFormats,
      deckArchetypes: values.deckArchetypes,
      maxCardEnergy: values.maxCardEnergy ?? null,
      allowedTribes: values.allowedTribes,
      allowMugic: values.allowMugic,
      locationMode: values.locationMode,
      definedLocations: values.locationMode === "defined" ? values.definedLocations : [],
      additionalRules: values.additionalRules ?? null,
      scheduleType: values.scheduleType,
      startAt: values.startAt ? values.startAt.toISOString() : null,
      endAt: values.scheduleType === "date_range" && values.endAt ? values.endAt.toISOString() : null,
      periodDays: values.scheduleType === "recurring_interval" ? values.periodDays ?? null : null,
      isEnabled: values.isEnabled,
    };

    const isEditing = Boolean(editingTournamentId);
    await runWithSubmitToast(
      async () => {
        await saveMutation.mutateAsync({ id: editingTournamentId, payload });
        await queryClient.invalidateQueries({ queryKey: adminQueryKeys.tournaments });

        setEditingTournamentId(null);
        form.resetFields();
        clearCover();
      },
      {
        successMessage: isEditing ? "Torneio atualizado com sucesso." : "Torneio cadastrado com sucesso.",
        defaultErrorMessage: "Erro ao salvar torneio.",
      },
    );
  }

  const startEdit = useCallback((tournament: TournamentDto) => {
    setEditingTournamentId(tournament.id);
    form.setFieldsValue({
      name: tournament.name,
      coverImageFileId: tournament.coverImageFileId ?? undefined,
      cardsCount: tournament.cardsCount,
      playersCount: tournament.playersCount,
      allowedFormats: tournament.allowedFormats,
      deckArchetypes: tournament.deckArchetypes,
      maxCardEnergy: tournament.maxCardEnergy ?? undefined,
      allowedTribes: tournament.allowedTribes,
      allowMugic: tournament.allowMugic,
      locationMode: tournament.locationMode,
      definedLocations: tournament.definedLocations,
      additionalRules: tournament.additionalRules ?? undefined,
      scheduleType: tournament.scheduleType,
      startAt: tournament.startAt ? dayjs(tournament.startAt) : undefined,
      endAt: tournament.endAt ? dayjs(tournament.endAt) : undefined,
      periodDays: tournament.periodDays ?? undefined,
      isEnabled: tournament.isEnabled,
    });

    setExistingCover({
      url: tournament.coverImageUrl,
      uid: tournament.id,
      name: "capa-atual",
    });
  }, [form, setExistingCover]);

  function cancelEdit() {
    setEditingTournamentId(null);
    form.resetFields();
    clearCover();
  }

  const onDelete = useCallback(async (tournamentId: string) => {
    setDeletingTournamentId(tournamentId);

    try {
      await runWithSubmitToast(
        async () => {
          await deleteMutation.mutateAsync(tournamentId);
          await queryClient.invalidateQueries({ queryKey: adminQueryKeys.tournaments });
        },
        {
          successMessage: "Torneio removido com sucesso.",
          defaultErrorMessage: "Erro ao remover torneio.",
        },
      );
    } finally {
      setDeletingTournamentId(null);
    }
  }, [deleteMutation, queryClient, runWithSubmitToast]);

  const columns = useMemo<ColumnsType<TournamentDto>>(
    () => [
      {
        title: "Nome",
        dataIndex: "name",
        key: "name",
        render: (name: string) => <Text strong>{name}</Text>,
      },
      {
        title: "Regras base",
        key: "rules",
        render: (_, row) => (
          <Space direction="vertical" size={4}>
            <Text>{row.cardsCount} cartas · {row.playersCount} jogadores</Text>
            <Text>Formatos: {row.allowedFormats.join(", ")}</Text>
            <Text>Tribos: {row.allowedTribes.length ? row.allowedTribes.join(", ") : "todas"}</Text>
            <Text>Mugics: {row.allowMugic ? "permitidas" : "bloqueadas"}</Text>
          </Space>
        ),
      },
      {
        title: "Agendamento",
        key: "schedule",
        render: (_, row) => (
          <Space direction="vertical" size={4}>
            <Text>{scheduleLabel(row)}</Text>
            <Tag color={row.isCurrentlyAvailable ? "green" : "default"}>
              {row.isCurrentlyAvailable ? "Disponível agora" : "Fora de janela"}
            </Tag>
          </Space>
        ),
      },
      {
        title: "Ações",
        key: "actions",
        width: 210,
        render: (_, row) => (
          <Space>
            <Button size="small" onClick={() => startEdit(row)}>
              Editar
            </Button>
            <Popconfirm
              title="Remover torneio"
              description="Essa ação não pode ser desfeita."
              okText="Remover"
              cancelText="Cancelar"
              onConfirm={() => onDelete(row.id)}
            >
              <Button size="small" danger icon={deletingTournamentId === row.id ? <LoadingLogo /> : undefined} disabled={deletingTournamentId === row.id}>
                Remover
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deletingTournamentId, onDelete, startEdit],
  );

  return (
    <AdminShell selectedKey="tournaments">
      <Space direction="vertical" size={20} style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <Card style={{ borderRadius: 16 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <TrophyOutlined />
              <Title level={3} style={{ margin: 0 }}>
                Cadastro de Torneios
              </Title>
            </Space>

            <Link href="/">
              <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
            </Link>
          </Space>
        </Card>

        <Card title={editingTournamentId ? "Editar torneio" : "Novo torneio"} style={{ borderRadius: 16 }}>
          <Form<TournamentFormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
              cardsCount: 20,
              playersCount: 2,
              allowedFormats: ["1x1"],
              deckArchetypes: ["decks mistos"],
              allowedTribes: [],
              allowMugic: true,
              locationMode: "random",
              definedLocations: [],
              scheduleType: "date_range",
              isEnabled: true,
            }}
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Form.Item label="Nome do torneio" name="name" rules={[{ required: true, message: "Informe o nome." }]}>
                <Input placeholder="Ex.: Torneio Semanal das Tribos" />
              </Form.Item>

              <Form.Item name="coverImageFileId" hidden>
                <Input type="hidden" />
              </Form.Item>

              <Form.Item label="Capa do torneio">
                <Upload
                  accept="image/*"
                  maxCount={1}
                  fileList={coverFileList}
                  disabled={isCoverUploading}
                  showUploadList={{ showRemoveIcon: false }}
                  beforeUpload={(file) => {
                    void attachCoverFile(file as File & { uid?: string });
                    return false;
                  }}
                >
                  <Button icon={isCoverUploading ? <LoadingLogo /> : undefined} disabled={isCoverUploading}>Anexar imagem</Button>
                </Upload>
                {coverPreviewUrl ? (
                  <div style={{ marginTop: 8 }}>
                    <Image
                      src={coverPreviewUrl}
                      alt="Preview da capa"
                      width={220}
                      height={120}
                      style={{ objectFit: "cover", borderRadius: 10 }}
                    />
                  </div>
                ) : null}
              </Form.Item>

              <Space wrap size={12}>
                <Form.Item label="Número de cartas" name="cardsCount" rules={[{ required: true, message: "Informe o número de cartas." }]}>
                  <InputNumber min={1} style={{ width: 180 }} />
                </Form.Item>

                <Form.Item label="Número de jogadores" name="playersCount" rules={[{ required: true, message: "Informe o número de jogadores." }]}>
                  <InputNumber min={1} style={{ width: 180 }} />
                </Form.Item>

                <Form.Item label="Energia máxima da carta" name="maxCardEnergy" tooltip="Ex.: 0 para permitir apenas cartas de energia até 0.">
                  <InputNumber min={0} style={{ width: 220 }} placeholder="Opcional" />
                </Form.Item>
              </Space>

              <Form.Item label="Formatos permitidos" name="allowedFormats" rules={[{ required: true, message: "Selecione ao menos um formato." }]}>
                <Select
                  mode="multiple"
                  options={TOURNAMENT_FORMAT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                />
              </Form.Item>

              <Form.Item label="Decks de IA" name="deckArchetypes" tooltip="Ex.: decks mistos, controle, agressivo.">
                <Select
                  mode="tags"
                  tokenSeparators={[","]}
                  placeholder="Digite e pressione Enter"
                />
              </Form.Item>

              <Form.Item label="Tribos permitidas" name="allowedTribes">
                <Select
                  mode="multiple"
                  options={CREATURE_TRIBE_OPTIONS.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  placeholder="Vazio = todas as tribos"
                />
              </Form.Item>

              <Form.Item label="Permitir Mugics" name="allowMugic" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item label="Modo dos locais" name="locationMode" rules={[{ required: true, message: "Selecione o modo de local." }]}>
                <Select options={TOURNAMENT_LOCATION_MODE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))} />
              </Form.Item>

              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  getFieldValue("locationMode") === "defined" ? (
                    <Form.Item
                      label="Locais definidos"
                      name="definedLocations"
                      rules={[{ required: true, message: "Informe ao menos um local." }]}
                    >
                      <Select mode="tags" tokenSeparators={[","]} placeholder="Digite locais e pressione Enter" />
                    </Form.Item>
                  ) : null
                )}
              </Form.Item>

              <Form.Item label="Regras adicionais" name="additionalRules">
                <Input.TextArea rows={3} placeholder="Descreva regras específicas do torneio" />
              </Form.Item>

              <Form.Item label="Tipo de agendamento" name="scheduleType" rules={[{ required: true, message: "Selecione o agendamento." }]}>
                <Select options={TOURNAMENT_SCHEDULE_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))} />
              </Form.Item>

              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  getFieldValue("scheduleType") === "date_range" ? (
                    <Space wrap size={12}>
                      <Form.Item label="Início" name="startAt" rules={[{ required: true, message: "Informe o início." }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" />
                      </Form.Item>
                      <Form.Item label="Fim" name="endAt" rules={[{ required: true, message: "Informe o fim." }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" />
                      </Form.Item>
                    </Space>
                  ) : (
                    <Space wrap size={12}>
                      <Form.Item label="Data base" name="startAt" tooltip="Opcional. Se vazio, usa criação do torneio.">
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" />
                      </Form.Item>
                      <Form.Item label="Período (dias)" name="periodDays" rules={[{ required: true, message: "Informe o período em dias." }]}>
                        <InputNumber min={1} style={{ width: 200 }} />
                      </Form.Item>
                    </Space>
                  )
                )}
              </Form.Item>

              <Form.Item label="Torneio habilitado" name="isEnabled" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Space>
                <Button type="primary" htmlType="submit" icon={saveMutation.isPending ? <LoadingLogo /> : undefined} disabled={saveMutation.isPending}>
                  {editingTournamentId ? "Salvar edição" : "Cadastrar torneio"}
                </Button>
                {editingTournamentId ? (
                  <Button onClick={cancelEdit}>Cancelar edição</Button>
                ) : null}
              </Space>
            </Space>
          </Form>
        </Card>

        <Card title="Torneios cadastrados" style={{ borderRadius: 16 }}>
          <SearchableDataTable<TournamentDto>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            searchFields={["name", "scheduleType"]}
            searchPlaceholder="Buscar torneio por nome ou tipo de agenda"
            pageSize={8}
            scrollX={1200}
          />
        </Card>
      </Space>
    </AdminShell>
  );
}
