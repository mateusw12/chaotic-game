"use client";

import { useCallback, useState } from "react";
import type { UploadFile } from "antd/es/upload/interface";
import type { MessageInstance } from "antd/es/message/interface";

type FormFieldSetter = {
    setFieldValue: (name: string, value: unknown) => void;
};

type UseImageUploadFieldOptions<TUploadResponse> = {
    messageApi: MessageInstance;
    uploadFile: (formData: FormData) => Promise<TUploadResponse>;
    getPublicUrl: (response: TUploadResponse) => string | null | undefined;
    getFieldValue?: (response: TUploadResponse) => string | null | undefined;
    form?: FormFieldSetter;
    fieldName?: string;
    successMessage?: string;
    defaultErrorMessage?: string;
};

type ExistingImageOptions = {
    url: string | null;
    uid?: string;
    name?: string;
};

export function useImageUploadField<TUploadResponse>({
    messageApi,
    uploadFile,
    getPublicUrl,
    getFieldValue,
    form,
    fieldName,
    successMessage = "Imagem enviada com sucesso.",
    defaultErrorMessage = "Erro ao anexar imagem.",
}: UseImageUploadFieldOptions<TUploadResponse>) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const clearImage = useCallback(() => {
        if (form && fieldName) {
            form.setFieldValue(fieldName, undefined);
        }

        setPreviewUrl(null);
        setFileList([]);
    }, [fieldName, form]);

    const setExistingImage = useCallback(({ url, uid, name }: ExistingImageOptions) => {
        if (url) {
            setPreviewUrl(url);
            setFileList([
                {
                    uid: uid ?? `existing-${Date.now()}`,
                    name: name ?? "imagem-atual",
                    status: "done",
                    url,
                },
            ]);
            return;
        }

        setPreviewUrl(null);
        setFileList([]);
    }, []);

    const attachFile = useCallback(async (file: File & { uid?: string }) => {
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await uploadFile(formData);
            const fieldValue = getFieldValue?.(response);
            const publicUrl = getPublicUrl(response) ?? URL.createObjectURL(file);

            if (form && fieldName && fieldValue !== undefined) {
                form.setFieldValue(fieldName, fieldValue);
            }

            setPreviewUrl(publicUrl);
            setFileList([
                {
                    uid: file.uid ?? `${Date.now()}`,
                    name: file.name,
                    status: "done",
                    url: publicUrl ?? undefined,
                },
            ]);

            messageApi.success(successMessage);
        } catch (error) {
            messageApi.error(error instanceof Error ? error.message : defaultErrorMessage);
        } finally {
            setIsUploading(false);
        }
    }, [defaultErrorMessage, fieldName, form, getFieldValue, getPublicUrl, messageApi, successMessage, uploadFile]);

    return {
        isUploading,
        previewUrl,
        fileList,
        attachFile,
        clearImage,
        setExistingImage,
    };
}
