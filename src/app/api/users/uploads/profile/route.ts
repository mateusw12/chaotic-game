import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadUserProfileImageToStorage } from "@/lib/supabase";

export const runtime = "nodejs";

type UploadLikeFile = {
    name: string;
    size: number;
    type?: string;
    arrayBuffer: () => Promise<ArrayBuffer>;
};

function isUploadLikeFile(value: unknown): value is UploadLikeFile {
    if (!value || typeof value !== "object") {
        return false;
    }

    const maybeFile = value as Partial<UploadLikeFile>;

    return (
        typeof maybeFile.name === "string"
        && typeof maybeFile.size === "number"
        && typeof maybeFile.arrayBuffer === "function"
    );
}

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json(
            {
                success: false,
                file: null,
                message: "Usuário não autenticado.",
            },
            { status: 401 },
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") ?? formData.get("image");

        if (!isUploadLikeFile(file)) {
            return NextResponse.json(
                {
                    success: false,
                    file: null,
                    message: "Arquivo inválido.",
                },
                { status: 400 },
            );
        }

        if (file.size <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    file: null,
                    message: "Arquivo vazio.",
                },
                { status: 400 },
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const uploaded = await uploadUserProfileImageToStorage({
            fileName: file.name,
            fileBuffer: arrayBuffer,
            contentType: file.type ?? undefined,
        });

        return NextResponse.json(
            {
                success: true,
                file: {
                    path: uploaded.path,
                    publicUrl: uploaded.publicUrl,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                file: null,
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao enviar imagem de perfil para o Storage.",
            },
            { status: 500 },
        );
    }
}
