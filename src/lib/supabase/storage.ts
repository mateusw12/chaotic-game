import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getCreatureImagesBucketName() {
    return process.env.SUPABASE_CREATURE_IMAGES_BUCKET ?? "creature-images";
}

function getLocationImagesBucketName() {
    return process.env.SUPABASE_LOCATION_IMAGES_BUCKET ?? "location-images";
}

function getBattlegearImagesBucketName() {
    return process.env.SUPABASE_BATTLEGEAR_IMAGES_BUCKET ?? "battlegear-images";
}

function getMugicImagesBucketName() {
    return process.env.SUPABASE_MUGIC_IMAGES_BUCKET ?? "mugic-images";
}

type StorageApiError = {
    name?: string;
    message: string;
    statusCode?: number;
};

export function getSupabaseAdminClient() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error(
            "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.",
        );
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

function sanitizeFileName(fileName: string) {
    const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
    return normalized.replace(/-+/g, "-");
}

export function getCreatureImagePublicUrl(imageFileId: string | null): string | null {
    if (!imageFileId) {
        return null;
    }

    const supabase = getSupabaseAdminClient();
    const bucketName = getCreatureImagesBucketName();
    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

    return publicUrl || null;
}

export function getLocationImagePublicUrl(imageFileId: string | null): string | null {
    if (!imageFileId) {
        return null;
    }

    const supabase = getSupabaseAdminClient();
    const bucketName = getLocationImagesBucketName();
    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

    return publicUrl || null;
}

export function getBattlegearImagePublicUrl(imageFileId: string | null): string | null {
    if (!imageFileId) {
        return null;
    }

    const supabase = getSupabaseAdminClient();
    const bucketName = getBattlegearImagesBucketName();
    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

    return publicUrl || null;
}

export function getMugicImagePublicUrl(imageFileId: string | null): string | null {
    if (!imageFileId) {
        return null;
    }

    const supabase = getSupabaseAdminClient();
    const bucketName = getMugicImagesBucketName();
    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

    return publicUrl || null;
}

export async function uploadCreatureImageToStorage(payload: {
    fileName: string;
    fileBuffer: ArrayBuffer;
    contentType?: string;
}): Promise<{ path: string; publicUrl: string }> {
    const supabase = getSupabaseAdminClient();
    const bucketName = getCreatureImagesBucketName();

    const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);

    const bucketNotFound = Boolean(
        getBucketError
        && (
            (getBucketError as StorageApiError).statusCode === 404
            || /bucket not found/i.test(getBucketError.message)
        ),
    );

    if (getBucketError && !bucketNotFound) {
        throw new Error(
            `Erro ao validar bucket de imagens [${getBucketError.name ?? "STORAGE"}]: ${getBucketError.message}`,
        );
    }

    if (!existingBucket || bucketNotFound) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: "10MB",
        });

        if (createBucketError && !/already exists/i.test(createBucketError.message)) {
            throw new Error(
                `Erro ao criar bucket de imagens [${createBucketError.name ?? "STORAGE"}]: ${createBucketError.message}`,
            );
        }
    }

    const safeFileName = sanitizeFileName(payload.fileName || "image");
    const path = `creatures/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`;

    const { error } = await supabase.storage.from(bucketName).upload(path, payload.fileBuffer, {
        contentType: payload.contentType,
        upsert: false,
    });

    if (error) {
        throw new Error(
            `Erro ao enviar imagem para o Storage [${error.name ?? "STORAGE"}]: ${error.message}`,
        );
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública da imagem.");
    }

    return { path, publicUrl };
}

export async function uploadLocationImageToStorage(payload: {
    fileName: string;
    fileBuffer: ArrayBuffer;
    contentType?: string;
}): Promise<{ path: string; publicUrl: string }> {
    const supabase = getSupabaseAdminClient();
    const bucketName = getLocationImagesBucketName();

    const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);

    const bucketNotFound = Boolean(
        getBucketError
        && (
            (getBucketError as StorageApiError).statusCode === 404
            || /bucket not found/i.test(getBucketError.message)
        ),
    );

    if (getBucketError && !bucketNotFound) {
        throw new Error(
            `Erro ao validar bucket de locais [${getBucketError.name ?? "STORAGE"}]: ${getBucketError.message}`,
        );
    }

    if (!existingBucket || bucketNotFound) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: "10MB",
        });

        if (createBucketError && !/already exists/i.test(createBucketError.message)) {
            throw new Error(
                `Erro ao criar bucket de locais [${createBucketError.name ?? "STORAGE"}]: ${createBucketError.message}`,
            );
        }
    }

    const safeFileName = sanitizeFileName(payload.fileName || "image");
    const path = `locations/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`;

    const { error } = await supabase.storage.from(bucketName).upload(path, payload.fileBuffer, {
        contentType: payload.contentType,
        upsert: false,
    });

    if (error) {
        throw new Error(
            `Erro ao enviar imagem de local para o Storage [${error.name ?? "STORAGE"}]: ${error.message}`,
        );
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública da imagem do local.");
    }

    return { path, publicUrl };
}

export async function uploadBattleGearImageToStorage(payload: {
    fileName: string;
    fileBuffer: ArrayBuffer;
    contentType?: string;
}): Promise<{ path: string; publicUrl: string }> {
    const supabase = getSupabaseAdminClient();
    const bucketName = getBattlegearImagesBucketName();

    const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);

    const bucketNotFound = Boolean(
        getBucketError
        && (
            (getBucketError as StorageApiError).statusCode === 404
            || /bucket not found/i.test(getBucketError.message)
        ),
    );

    if (getBucketError && !bucketNotFound) {
        throw new Error(
            `Erro ao validar bucket de equipamentos [${getBucketError.name ?? "STORAGE"}]: ${getBucketError.message}`,
        );
    }

    if (!existingBucket || bucketNotFound) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: "10MB",
        });

        if (createBucketError && !/already exists/i.test(createBucketError.message)) {
            throw new Error(
                `Erro ao criar bucket de equipamentos [${createBucketError.name ?? "STORAGE"}]: ${createBucketError.message}`,
            );
        }
    }

    const safeFileName = sanitizeFileName(payload.fileName || "image");
    const path = `battlegear/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`;

    const { error } = await supabase.storage.from(bucketName).upload(path, payload.fileBuffer, {
        contentType: payload.contentType,
        upsert: false,
    });

    if (error) {
        throw new Error(
            `Erro ao enviar imagem de equipamento para o Storage [${error.name ?? "STORAGE"}]: ${error.message}`,
        );
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública da imagem do equipamento.");
    }

    return { path, publicUrl };
}

export async function uploadMugicImageToStorage(payload: {
    fileName: string;
    fileBuffer: ArrayBuffer;
    contentType?: string;
}): Promise<{ path: string; publicUrl: string }> {
    const supabase = getSupabaseAdminClient();
    const bucketName = getMugicImagesBucketName();

    const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);

    const bucketNotFound = Boolean(
        getBucketError
        && (
            (getBucketError as StorageApiError).statusCode === 404
            || /bucket not found/i.test(getBucketError.message)
        ),
    );

    if (getBucketError && !bucketNotFound) {
        throw new Error(
            `Erro ao validar bucket de mugic [${getBucketError.name ?? "STORAGE"}]: ${getBucketError.message}`,
        );
    }

    if (!existingBucket || bucketNotFound) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: "10MB",
        });

        if (createBucketError && !/already exists/i.test(createBucketError.message)) {
            throw new Error(
                `Erro ao criar bucket de mugic [${createBucketError.name ?? "STORAGE"}]: ${createBucketError.message}`,
            );
        }
    }

    const safeFileName = sanitizeFileName(payload.fileName || "image");
    const path = `mugic/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`;

    const { error } = await supabase.storage.from(bucketName).upload(path, payload.fileBuffer, {
        contentType: payload.contentType,
        upsert: false,
    });

    if (error) {
        throw new Error(
            `Erro ao enviar imagem de mugic para o Storage [${error.name ?? "STORAGE"}]: ${error.message}`,
        );
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública da imagem de mugic.");
    }

    return { path, publicUrl };
}
