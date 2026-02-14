"use client";

import { useMemo, useState } from "react";
import { App as AntdApp, Avatar, Button, Card, Form, Input, Space, Typography, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { UserProfileResponseDto } from "@/dto/user";
import { PlayerShell } from "@/components/player/player-shell";
import { useDisplayUserName } from "@/hooks/use-display-user-name";
import styles from "./profile-view.module.css";

type ProfileViewProps = {
    name: string | null;
    nickName: string | null;
    imageUrl: string | null;
    userRole: "user" | "admin";
    coins: number;
    diamonds: number;
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

    const handleSubmit = async (values: ProfileFormValues) => {
        setSaving(true);

        try {
            const response = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    nickName: values.nickName,
                    imageUrl: values.imageUrl,
                }),
            });

            const payload = (await response.json()) as UserProfileResponseDto;

            if (!response.ok || !payload.success || !payload.profile) {
                throw new Error(payload.message ?? "Não foi possível atualizar o perfil.");
            }

            setCurrentNickName(payload.profile.nickName);
            setCurrentImageUrl(payload.profile.imageUrl);
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

            const response = await fetch("/api/users/uploads/profile", {
                method: "POST",
                body: formData,
            });

            const payload = (await response.json()) as {
                success: boolean;
                file: { path: string; publicUrl: string } | null;
                message?: string;
            };

            if (!response.ok || !payload.success || !payload.file?.publicUrl) {
                throw new Error(payload.message ?? "Falha ao enviar imagem de perfil.");
            }

            setCurrentImageUrl(payload.file.publicUrl);
            profileForm.setFieldValue("imageUrl", payload.file.publicUrl);
            setImageFileList([
                {
                    uid: file.uid ?? `${Date.now()}`,
                    name: file.name,
                    status: "done",
                    url: payload.file.publicUrl,
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
