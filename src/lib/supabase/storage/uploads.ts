import { getSupabaseAdminClient, sanitizeFileName, type StorageApiError } from "./client";
import {
    getCreatureImagesBucketName,
    getLocationImagesBucketName,
    getBattlegearImagesBucketName,
    getMugicImagesBucketName,
    getAttacksImagesBucketName,
    getUserProfileImagesBucketName,
    getTournamentCoverImagesBucketName,
    getStorePackImagesBucketName,
} from "./buckets";

type UploadPayload = {
    fileName: string;
    fileBuffer: ArrayBuffer;
    contentType?: string;
};

type UploadResult = {
    path: string;
    publicUrl: string;
};

async function ensureBucket(bucketName: string): Promise<void> {
    const supabase = getSupabaseAdminClient();

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
            `Erro ao validar bucket [${getBucketError.name ?? "STORAGE"}]: ${getBucketError.message}`,
        );
    }

    if (!existingBucket || bucketNotFound) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: "10MB",
        });

        if (createBucketError && !/already exists/i.test(createBucketError.message)) {
            throw new Error(
                `Erro ao criar bucket [${createBucketError.name ?? "STORAGE"}]: ${createBucketError.message}`,
            );
        }
    }
}

async function uploadFile(
    bucketName: string,
    pathPrefix: string,
    payload: UploadPayload,
): Promise<UploadResult> {
    const supabase = getSupabaseAdminClient();

    await ensureBucket(bucketName);

    const safeFileName = sanitizeFileName(payload.fileName || "image");
    const path = `${pathPrefix}/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`;

    const { error } = await supabase.storage.from(bucketName).upload(path, payload.fileBuffer, {
        contentType: payload.contentType,
        upsert: false,
    });

    if (error) {
        throw new Error(
            `Erro ao enviar arquivo para o Storage [${error.name ?? "STORAGE"}]: ${error.message}`,
        );
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(path);

    if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública do arquivo.");
    }

    return { path, publicUrl };
}

export async function uploadCreatureImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getCreatureImagesBucketName(), "creatures", payload);
}

export async function uploadLocationImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getLocationImagesBucketName(), "locations", payload);
}

export async function uploadBattleGearImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getBattlegearImagesBucketName(), "battlegear", payload);
}

export async function uploadMugicImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getMugicImagesBucketName(), "mugic", payload);
}

export async function uploadAttackImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getAttacksImagesBucketName(), "attacks", payload);
}

export async function uploadUserProfileImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getUserProfileImagesBucketName(), "users", payload);
}

export async function uploadTournamentCoverToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getTournamentCoverImagesBucketName(), "tournaments", payload);
}

export async function uploadStorePackImageToStorage(payload: UploadPayload): Promise<UploadResult> {
    return uploadFile(getStorePackImagesBucketName(), "store-packs", payload);
}
