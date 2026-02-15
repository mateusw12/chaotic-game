"use client";

import { useMemo, useState } from "react";
import { App as AntdApp, Avatar, Button, Card, Col, Form, Input, Progress, Row, Space, Statistic, Typography, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { UserProgressionOverviewDto } from "@/dto/progression";
import { CREATURE_TRIBE_OPTIONS } from "@/dto/creature";
import { PlayerShell } from "@/components/player/player-shell";
import { useDisplayUserName } from "@/hooks/use-display-user-name";
import { ProfileService } from "@/lib/api/service";
import styles from "./profile-view.module.css";

type ProfileViewProps = {
    name: string | null;
    nickName: string | null;
    imageUrl: string | null;
    userRole: "user" | "admin";
    coins: number;
    diamonds: number;
    progressionOverview: UserProgressionOverviewDto | null;
};

const { Title, Paragraph, Text } = Typography;

type ProfileFormValues = {
    nickName?: string;
    imageUrl?: string;
};

export function ProfileView({
    name,
    nickName,
    imageUrl,
    userRole,
    coins,
    diamonds,
    progressionOverview,
}: ProfileViewProps) {
    const { message } = AntdApp.useApp();
    const [profileForm] = Form.useForm<ProfileFormValues>();
    const [saving, setSaving] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [currentNickName, setCurrentNickName] = useState(nickName);
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

    const displayUserName = useDisplayUserName({
        name,
        nickName: currentNickName,
    });

    const avatarInitial = useMemo(() => displayUserName.charAt(0).toUpperCase(), [displayUserName]);

    const progression = progressionOverview?.progression;
    const stats = progressionOverview?.stats;
    const xpPercent = progression && progression.xpNextLevel > 0
        ? Math.min(100, Math.round((progression.xpCurrentLevel / progression.xpNextLevel) * 100))
        : 0;

    const handleSubmit = async (values: ProfileFormValues) => {
        setSaving(true);

        try {
            const profile = await ProfileService.updateProfile({
                nickName: values.nickName,
                imageUrl: values.imageUrl,
            });

            setCurrentNickName(profile.nickName);
            setCurrentImageUrl(profile.imageUrl);
            message.success("Perfil atualizado com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    };

    async function attachProfileImage(file: File & { uid?: string }) {
        setIsImageUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const publicUrl = await ProfileService.uploadProfileImage(formData);

            setCurrentImageUrl(publicUrl);
            profileForm.setFieldValue("imageUrl", publicUrl);
            setImageFileList([
                {
                    uid: file.uid ?? `${Date.now()}`,
                    name: file.name,
                    status: "done",
                    url: publicUrl,
                },
            ]);
            message.success("Imagem enviada para o Storage com sucesso.");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Erro ao anexar imagem de perfil.");
        } finally {
            setIsImageUploading(false);
        }
    }

    return (
        <PlayerShell
            selectedKey="home"
            userName={name}
            userNickName={currentNickName}
            userImageUrl={currentImageUrl}
            coins={coins}
            diamonds={diamonds}
            userRole={userRole}
        >
            <Card className={styles.profileCard}>
                <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                    <div>
                        <Title level={3} style={{ marginTop: 0, marginBottom: 6 }}>
                            Editar perfil
                        </Title>
                        <Paragraph style={{ marginBottom: 0 }}>
                            Defina seu nickName e anexe sua imagem de perfil.
                        </Paragraph>
                    </div>

                    <div className={styles.previewBlock}>
                        <Avatar src={currentImageUrl ?? undefined} size={44}>{avatarInitial}</Avatar>
                        <div>
                            <Text className={styles.previewLabel}>Nome exibido</Text>
                            <div><Text strong>{displayUserName}</Text></div>
                        </div>
                    </div>

                    <Card size="small" className={styles.statsCard}>
                        <Space orientation="vertical" size={14} style={{ width: "100%" }}>
                            <div>
                                <Text className={styles.previewLabel}>Nível atual</Text>
                                <div className={styles.levelLine}>
                                    <Text strong>Nível {progression?.level ?? 1}</Text>
                                    <Text type="secondary">XP {progression?.xpCurrentLevel ?? 0}/{progression?.xpNextLevel ?? 100}</Text>
                                </div>
                                <Progress percent={xpPercent} />
                            </div>

                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Score" value={stats?.score ?? progression?.xpTotal ?? 0} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Vitórias" value={stats?.victories ?? 0} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Derrotas" value={stats?.defeats ?? 0} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Total de cards" value={stats?.totalCards ?? progressionOverview?.inventory.reduce((sum, item) => sum + item.quantity, 0) ?? 0} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Locais" value={stats?.locationCards ?? 0} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Equipamentos" value={stats?.battlegearCards ?? 0} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Card size="small">
                                        <Statistic title="Ataques" value={stats?.attackCards ?? 0} />
                                    </Card>
                                </Col>
                            </Row>

                            <div>
                                <Text className={styles.previewLabel}>Cards por tribo</Text>
                                <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                    {CREATURE_TRIBE_OPTIONS.map((tribe) => (
                                        <Col key={tribe.value} xs={24} sm={12} md={8}>
                                            <Card size="small">
                                                <Statistic title={tribe.label} value={stats?.cardsByTribe?.[tribe.value] ?? 0} />
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Space>
                    </Card>

                    <Form
                        form={profileForm}
                        layout="vertical"
                        initialValues={{
                            nickName: currentNickName ?? "",
                            imageUrl: currentImageUrl ?? "",
                        }}
                        onFinish={(values) => void handleSubmit(values)}
                        className={styles.formRow}
                    >
                        <Form.Item
                            name="nickName"
                            label="NickName"
                            rules={[{ max: 32, message: "Use no máximo 32 caracteres." }]}
                        >
                            <Input placeholder="Ex: ChaoticMaster" />
                        </Form.Item>

                        <Form.Item name="imageUrl" hidden>
                            <Input type="hidden" />
                        </Form.Item>

                        <Form.Item label="Imagem de perfil">
                            <Upload
                                accept="image/*"
                                maxCount={1}
                                fileList={imageFileList}
                                disabled={isImageUploading}
                                beforeUpload={(file) => {
                                    void attachProfileImage(file);
                                    return false;
                                }}
                                onRemove={() => {
                                    setCurrentImageUrl(null);
                                    setImageFileList([]);
                                    profileForm.setFieldValue("imageUrl", null);
                                }}
                            >
                                <Button loading={isImageUploading}>Anexar imagem</Button>
                            </Upload>
                        </Form.Item>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            Salvar alterações
                        </Button>
                    </Form>
                </Space>
            </Card>
        </PlayerShell>
    );
}
