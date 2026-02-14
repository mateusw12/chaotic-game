import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserByEmail, uploadMugicImageToStorage } from "@/lib/supabase";

export const runtime = "nodejs";

function isUploadFile(value: FormDataEntryValue | null): value is File {
    return value instanceof File;
}

async function ensureAdminBySessionEmail(email: string | null | undefined) {
    if (!email) {
        return { ok: false as const, status: 401, message: "Usuário não autenticado." };
    }

    const user = await getUserByEmail(email);

    if (!user) {
        return { ok: false as const, status: 404, message: "Usuário não encontrado." };
    }

    if (user.role !== "admin") {
        return {
            ok: false as const,
            status: 403,
            message: "Acesso negado. Apenas admin pode enviar imagens.",
        };
    }

    return { ok: true as const };
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            return NextResponse.json(
                { success: false, file: null, message: access.message },
                { status: access.status },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") ?? formData.get("image");

        if (!isUploadFile(file)) {
            return NextResponse.json(
                { success: false, file: null, message: "Arquivo inválido." },
                { status: 400 },
            );
        }

        if (file.size <= 0) {
            return NextResponse.json(
                { success: false, file: null, message: "Arquivo vazio." },
                { status: 400 },
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const uploaded = await uploadMugicImageToStorage({
            fileName: file.name,
            fileBuffer: arrayBuffer,
            contentType: file.type ?? undefined,
        });

        return NextResponse.json(
            {
                success: true,
                file: {
                    imageFileId: uploaded.path,
                    path: uploaded.path,
                    publicUrl: uploaded.publicUrl ?? null,
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
                        : "Erro ao enviar imagem para o Storage.",
            },
            { status: 500 },
        );
    }
}
