import { NextResponse } from "next/server";
import attacksSeed from "@/components/data/attack.json";
import { auth } from "@/lib/auth";
import {
    getUserByEmail,
    listAttacks,
    updateAttackImageFileById,
    uploadAttackImageToStorage,
} from "@/lib/supabase";

export const runtime = "nodejs";

type UploadLikeFile = {
    name: string;
    size: number;
    type?: string;
    arrayBuffer: () => Promise<ArrayBuffer>;
};

type ImportAttackImagesResponseDto = {
    success: boolean;
    uploaded: number;
    updated: number;
    skipped: number;
    matched: number;
    message?: string;
    unmatchedFiles?: string[];
    failedFiles?: Array<{ fileName: string; reason: string }>;
};

type SeedAttack = {
    name?: unknown;
    file_name?: unknown;
    fileName?: unknown;
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

function removeExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, "");
}

function normalizeLookup(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
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
            message: "Acesso negado. Apenas admin pode importar imagens de ataques.",
        };
    }

    return { ok: true as const };
}

function buildSeedFileNameMap(): Map<string, string> {
    const map = new Map<string, string>();

    for (const item of attacksSeed as SeedAttack[]) {
        const name = typeof item.name === "string" ? item.name.trim() : "";
        if (!name) {
            continue;
        }

        const normalizedName = normalizeLookup(name);
        if (normalizedName) {
            map.set(normalizedName, name);
        }

        const seedFileNameValue = item.file_name ?? item.fileName;
        const seedFileName = typeof seedFileNameValue === "string" ? seedFileNameValue.trim() : "";

        if (!seedFileName) {
            continue;
        }

        const normalizedFileName = normalizeLookup(removeExtension(seedFileName));
        if (normalizedFileName) {
            map.set(normalizedFileName, name);
        }
    }

    return map;
}

export async function POST(request: Request) {
    const session = await auth();

    try {
        const access = await ensureAdminBySessionEmail(session?.user?.email);

        if (!access.ok) {
            const denied: ImportAttackImagesResponseDto = {
                success: false,
                uploaded: 0,
                updated: 0,
                skipped: 0,
                matched: 0,
                message: access.message,
            };

            return NextResponse.json(denied, { status: access.status });
        }

        const formData = await request.formData();
        const rawFiles = formData.getAll("files");

        const files: UploadLikeFile[] = [];
        for (const item of rawFiles) {
            if (isUploadLikeFile(item)) {
                files.push(item);
            }
        }

        if (files.length === 0) {
            const emptyResponse: ImportAttackImagesResponseDto = {
                success: false,
                uploaded: 0,
                updated: 0,
                skipped: 0,
                matched: 0,
                message: "Nenhum arquivo válido foi enviado. Use o campo files.",
            };

            return NextResponse.json(emptyResponse, { status: 400 });
        }

        const attacks = await listAttacks();
        const attackByNormalizedName = new Map(
            attacks.map((attack) => [normalizeLookup(attack.name), attack]),
        );
        const seedFileNameMap = buildSeedFileNameMap();

        let uploaded = 0;
        let updated = 0;
        let skipped = 0;
        let matched = 0;
        const unmatchedFiles: string[] = [];
        const failedFiles: Array<{ fileName: string; reason: string }> = [];

        for (const file of files) {
            if (file.size <= 0) {
                skipped += 1;
                failedFiles.push({ fileName: file.name, reason: "Arquivo vazio." });
                continue;
            }

            const fileKey = normalizeLookup(removeExtension(file.name));
            const attackNameFromSeed = seedFileNameMap.get(fileKey);
            const attack = attackByNormalizedName.get(
                attackNameFromSeed ? normalizeLookup(attackNameFromSeed) : fileKey,
            );

            if (!attack) {
                skipped += 1;
                unmatchedFiles.push(file.name);
                continue;
            }

            matched += 1;

            try {
                const fileBuffer = await file.arrayBuffer();
                const uploadedFile = await uploadAttackImageToStorage({
                    fileName: file.name,
                    fileBuffer,
                    contentType: file.type ?? undefined,
                });

                uploaded += 1;
                await updateAttackImageFileById(attack.id, uploadedFile.path);
                updated += 1;
            } catch (error) {
                skipped += 1;
                failedFiles.push({
                    fileName: file.name,
                    reason: error instanceof Error ? error.message : "Erro ao processar arquivo.",
                });
            }
        }

        const response: ImportAttackImagesResponseDto = {
            success: true,
            uploaded,
            updated,
            skipped,
            matched,
            unmatchedFiles,
            failedFiles,
            message: "Importação de imagens concluída.",
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const response: ImportAttackImagesResponseDto = {
            success: false,
            uploaded: 0,
            updated: 0,
            skipped: 0,
            matched: 0,
            message:
                error instanceof Error
                    ? error.message
                    : "Erro ao importar imagens de ataques.",
        };

        return NextResponse.json(response, { status: 500 });
    }
}
