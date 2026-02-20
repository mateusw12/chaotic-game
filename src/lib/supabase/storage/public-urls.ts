import { getSupabaseAdminClient } from "./client";
import {
  getCreatureImagesBucketName,
  getLocationImagesBucketName,
  getBattlegearImagesBucketName,
  getMugicImagesBucketName,
  getAttacksImagesBucketName,
  getTournamentCoverImagesBucketName,
  getStorePackImagesBucketName,
} from "./buckets";

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

export function getAttackImagePublicUrl(imageFileId: string | null): string | null {
  if (!imageFileId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const bucketName = getAttacksImagesBucketName();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

  return publicUrl || null;
}

export function getTournamentCoverImagePublicUrl(imageFileId: string | null): string | null {
  if (!imageFileId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const bucketName = getTournamentCoverImagesBucketName();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

  return publicUrl || null;
}

export function getStorePackImagePublicUrl(imageFileId: string | null): string | null {
  if (!imageFileId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const bucketName = getStorePackImagesBucketName();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

  return publicUrl || null;
}

export async function listAllCreatureImages(): Promise<Array<{ name: string; id: string }>> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getCreatureImagesBucketName();

  const allFiles: Array<{ name: string; id: string }> = [];

  // Função recursiva para listar arquivos em um diretório
  async function listFilesInPath(path: string = ""): Promise<void> {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`Erro ao listar arquivos no path "${path}":`, error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    for (const item of data) {
      // Se o item tem um ID mas não tem metadata, pode ser uma pasta
      const isFolder = item.id === null || (item.metadata && Object.keys(item.metadata).length === 0);
      const fullPath = path ? `${path}/${item.name}` : item.name;

      if (isFolder && item.name !== ".emptyFolderPlaceholder") {
        // É uma pasta, busca recursivamente
        await listFilesInPath(fullPath);
      } else if (item.id && item.name && !item.name.startsWith(".")) {
        // É um arquivo válido
        allFiles.push({
          name: item.name,
          id: fullPath,
        });
      }
    }
  }

  // Começa a busca da raiz do bucket
  await listFilesInPath("");

  return allFiles;
}

export async function listAllLocationImages(): Promise<Array<{ name: string; id: string }>> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getLocationImagesBucketName();

  const allFiles: Array<{ name: string; id: string }> = [];

  async function listFilesInPath(path: string = ""): Promise<void> {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`Erro ao listar arquivos no path "${path}":`, error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    for (const item of data) {
      const isFolder = item.id === null || (item.metadata && Object.keys(item.metadata).length === 0);
      const fullPath = path ? `${path}/${item.name}` : item.name;

      if (isFolder && item.name !== ".emptyFolderPlaceholder") {
        await listFilesInPath(fullPath);
      } else if (item.id && item.name && !item.name.startsWith(".")) {
        allFiles.push({ name: item.name, id: fullPath });
      }
    }
  }

  await listFilesInPath("");

  return allFiles;
}

export async function renameLocationImage(
  oldPath: string,
  newFileName: string,
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getLocationImagesBucketName();

  const pathParts = oldPath.split("/");
  const directory = pathParts.slice(0, -1).join("/");

  const oldFileName = pathParts[pathParts.length - 1];
  const extension = oldFileName.includes(".") ? oldFileName.substring(oldFileName.lastIndexOf(".")) : "";

  const safeNewFileName = `${newFileName}${extension}`;
  const newPath = `${directory}/${safeNewFileName}`;

  const { error: moveError } = await supabase.storage
    .from(bucketName)
    .move(oldPath, newPath);

  if (moveError) {
    throw new Error(`Erro ao renomear imagem [${moveError.name ?? "STORAGE"}]: ${moveError.message}`);
  }

  return newPath;
}

export async function renameCreatureImage(
  oldPath: string,
  newFileName: string,
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getCreatureImagesBucketName();

  // Extrai o diretório do caminho antigo
  const pathParts = oldPath.split("/");
  const directory = pathParts.slice(0, -1).join("/");

  // Preserva a extensão do arquivo original
  const oldFileName = pathParts[pathParts.length - 1];
  const extension = oldFileName.includes(".") ? oldFileName.substring(oldFileName.lastIndexOf(".")) : "";

  const safeNewFileName = `${newFileName}${extension}`;
  const newPath = `${directory}/${safeNewFileName}`;

  // Move/renomeia o arquivo
  const { error: moveError } = await supabase.storage
    .from(bucketName)
    .move(oldPath, newPath);

  if (moveError) {
    throw new Error(
      `Erro ao renomear imagem [${moveError.name ?? "STORAGE"}]: ${moveError.message}`,
    );
  }

  return newPath;
}

export async function listAllBattlegearImages(): Promise<Array<{ name: string; id: string }>> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getBattlegearImagesBucketName();

  const allFiles: Array<{ name: string; id: string }> = [];

  async function listFilesInPath(path: string = ""): Promise<void> {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`Erro ao listar arquivos no path "${path}":`, error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    for (const item of data) {
      const isFolder = item.id === null || (item.metadata && Object.keys(item.metadata).length === 0);
      const fullPath = path ? `${path}/${item.name}` : item.name;

      if (isFolder && item.name !== ".emptyFolderPlaceholder") {
        await listFilesInPath(fullPath);
      } else if (item.id && item.name && !item.name.startsWith(".")) {
        allFiles.push({ name: item.name, id: fullPath });
      }
    }
  }

  await listFilesInPath("");

  return allFiles;
}

export async function renameBattlegearImage(
  oldPath: string,
  newFileName: string,
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getBattlegearImagesBucketName();

  const pathParts = oldPath.split("/");
  const directory = pathParts.slice(0, -1).join("/");

  const oldFileName = pathParts[pathParts.length - 1];
  const extension = oldFileName.includes(".") ? oldFileName.substring(oldFileName.lastIndexOf(".")) : "";

  const safeNewFileName = `${newFileName}${extension}`;
  const newPath = `${directory}/${safeNewFileName}`;

  const { error: moveError } = await supabase.storage
    .from(bucketName)
    .move(oldPath, newPath);

  if (moveError) {
    throw new Error(`Erro ao renomear imagem [${moveError.name ?? "STORAGE"}]: ${moveError.message}`);
  }

  return newPath;
}
