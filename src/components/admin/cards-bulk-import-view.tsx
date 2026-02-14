"use client";

import { useMemo, useState } from "react";
import { App as AntdApp, Button, Card, Select, Space, Table, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { ArrowLeftOutlined, UploadOutlined, FileSearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { OcrCardResultDto, OcrCardsResponseDto } from "@/dto/import";
import type { OcrForcedCardType } from "@/dto/import";
import { AdminShell } from "@/components/admin/admin-shell";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

type CardsBulkImportViewProps = {
    initialItems?: OcrCardResultDto[];
};

export function CardsBulkImportView({ initialItems = [] }: CardsBulkImportViewProps) {
    const { message } = AntdApp.useApp();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [items, setItems] = useState<OcrCardResultDto[]>(initialItems);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [forcedCardType, setForcedCardType] = useState<OcrForcedCardType>("auto");

    const jsonOutput = useMemo(
        () => JSON.stringify({ generatedAt, items }, null, 2),
        [generatedAt, items],
    );

    const columns = useMemo<ColumnsType<OcrCardResultDto>>(
        () => [
            {
                title: "Arquivo",
                dataIndex: "fileName",
                key: "fileName",
            },
            {
                title: "Confiança OCR",
                key: "confidence",
                width: 140,
                render: (_, row) => `${row.confidence}%`,
            },
            {
                title: "Tipo sugerido",
                key: "cardType",
                width: 160,
                render: (_, row) => row.suggestion.cardType ?? "-",
            },
            {
                title: "Nome sugerido",
                key: "name",
                render: (_, row) => row.suggestion.name ?? "-",
            },
            {
                title: "Raridade",
                key: "rarity",
                width: 130,
                render: (_, row) => row.suggestion.rarity ?? "-",
            },
            {
                title: "Tribo",
                key: "tribe",
                width: 130,
                render: (_, row) => row.suggestion.tribe ?? "-",
            },
        ],
        [],
    );

    const handleGenerateJson = async () => {
        const files: Blob[] = [];

        for (const file of fileList) {
            if (file.originFileObj) {
                files.push(file.originFileObj);
            }
        }

        if (files.length === 0) {
            message.warning("Selecione imagens antes de gerar o JSON.");
            return;
        }

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append("forcedCardType", forcedCardType);

            for (const file of files) {
                formData.append("files", file);
            }

            const response = await fetch("/api/admin/cards/ocr", {
                method: "POST",
                body: formData,
            });

            const payload = (await response.json()) as OcrCardsResponseDto;

            if (!response.ok || !payload.success) {
                throw new Error(payload.message ?? "Erro ao gerar JSON por OCR.");
            }

            setItems(payload.items);
            setGeneratedAt(new Date().toISOString());
            message.success(`OCR concluído para ${payload.items.length} arquivo(s).`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro no OCR das imagens.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadJson = () => {
        if (items.length === 0) {
            message.warning("Nenhum item processado para exportar.");
            return;
        }

        const blob = new Blob([jsonOutput], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `cards-ocr-${Date.now()}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    return (
        <AdminShell selectedKey="bulk-import">
            <Card style={{ maxWidth: 1240, margin: "0 auto", borderRadius: 16 }}>
                <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space>
                            <FileSearchOutlined />
                            <Title level={3} style={{ margin: 0 }}>
                                Importação em Massa (OCR)
                            </Title>
                        </Space>

                        <Link href="/admin/permissions">
                            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
                        </Link>
                    </Space>

                    <Paragraph style={{ marginBottom: 0 }}>
                        Envie várias imagens de cards (em inglês) e gere um JSON para revisão antes de conectar no Supabase.
                        O OCR também tenta detectar a raridade pela cor do selo no topo direito da carta.
                    </Paragraph>

                    <Space orientation="vertical" size={6}>
                        <Text strong>Tipo do lote (opcional)</Text>
                        <Select<OcrForcedCardType>
                            value={forcedCardType}
                            onChange={setForcedCardType}
                            style={{ minWidth: 260 }}
                            options={[
                                { value: "auto", label: "Auto detectar" },
                                { value: "creature", label: "Criatura" },
                                { value: "location", label: "Local" },
                                { value: "mugic", label: "Mugic" },
                                { value: "battlegear", label: "Equipamento" },
                                { value: "attack", label: "Ataque" },
                            ]}
                        />
                    </Space>

                    <Dragger
                        multiple
                        accept="image/*"
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList: nextList }) => setFileList(nextList)}
                        onRemove={(file) => {
                            setFileList((previous) => previous.filter((item) => item.uid !== file.uid));
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">Clique ou arraste várias imagens para esta área</p>
                        <p className="ant-upload-hint">Suporte a lote de imagens escaneadas para OCR inicial.</p>
                    </Dragger>

                    <Space>
                        <Button type="primary" loading={isProcessing} onClick={() => void handleGenerateJson()}>
                            Gerar JSON via OCR
                        </Button>
                        <Button onClick={handleDownloadJson} disabled={items.length === 0}>
                            Baixar JSON
                        </Button>
                    </Space>

                    <Table<OcrCardResultDto>
                        rowKey={(item) => item.fileName}
                        columns={columns}
                        dataSource={items}
                        pagination={{ pageSize: 8 }}
                    />

                    <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                        <Text strong>JSON gerado para revisão:</Text>
                        <pre
                            style={{
                                margin: 0,
                                maxHeight: 360,
                                overflow: "auto",
                                background: "#0b1224",
                                color: "#d6e4ff",
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.12)",
                                padding: 12,
                            }}
                        >
                            {jsonOutput}
                        </pre>
                    </Space>
                </Space>
            </Card>
        </AdminShell>
    );
}
