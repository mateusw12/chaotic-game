import { NextResponse } from "next/server";
import { listMugics, updateMugicById } from "@/lib/supabase/mugic";
import { listAllMugicImages, renameMugicImage } from "@/lib/supabase/storage";
import mugicSeed from "@/components/data/mujic.json";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

function buildSeedFileNameByMugicName(): Map<string, string> {
  const map = new Map<string, string>();

  for (const item of mugicSeed as Array<{ name?: unknown; file_name?: unknown; fileName?: unknown }>) {
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const fileNameValue = item.file_name ?? item.fileName;
    const fileName = typeof fileNameValue === "string" ? fileNameValue.trim() : "";

    if (!name || !fileName) {
      continue;
    }

    map.set(normalizeLookup(name), normalizeLookup(removeExtension(fileName)));
  }

  return map;
}

function extractImageLookupKeys(fileName: string): string[] {
  const baseWithoutExt = removeExtension(fileName);
  const normalizedBase = normalizeLookup(baseWithoutExt);
  const keys = new Set<string>();

  if (normalizedBase) {
    keys.add(normalizedBase);
  }

  const withoutUuidPrefix = baseWithoutExt.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
  const normalizedWithoutUuidPrefix = normalizeLookup(withoutUuidPrefix);

  if (normalizedWithoutUuidPrefix) {
    keys.add(normalizedWithoutUuidPrefix);
  }

  const suffix = withoutUuidPrefix.split("-").pop() ?? "";
  const normalizedSuffix = normalizeLookup(suffix);

  if (normalizedSuffix) {
    keys.add(normalizedSuffix);
  }

  return Array.from(keys);
}

function buildImageIndex(
  images: Array<{ name: string; id: string }>,
  usedImageIds: Set<string>,
): Map<string, Array<{ name: string; id: string }>> {
  const index = new Map<string, Array<{ name: string; id: string }>>();

  for (const image of images) {
    if (usedImageIds.has(image.id)) {
      continue;
    }

    for (const key of extractImageLookupKeys(image.name)) {
      const current = index.get(key) ?? [];
      current.push(image);
      index.set(key, current);
    }
  }

  return index;
}

export async function POST() {
  try {
    const mugics = await listMugics();
    const seedFileNameByMugicName = buildSeedFileNameByMugicName();

    if (mugics.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhum mugic encontrado.", processed: 0, renamed: 0 });
    }

    let images = await listAllMugicImages();
    let imageById = new Map(images.map((img) => [img.id, img]));

    if (images.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma imagem encontrada no storage.", processed: 0, renamed: 0, imageList: [] });
    }

    let processedCount = 0;
    let renamedCount = 0;
    let updatedCount = 0;
    let fileNameUpdatedCount = 0;
    let notFoundCount = 0;
    const errors: string[] = [];
    const usedImageIds = new Set<string>();

    for (const mugic of mugics) {
      try {
        if (!mugic.imageFileId) {
          continue;
        }

        const normalizedMugicName = normalizeLookup(mugic.name);
        const existingImage = imageById.get(mugic.imageFileId);

        if (!existingImage) {
          continue;
        }

        const existingImageKeys = extractImageLookupKeys(existingImage.name);
        const existingIsSynced = existingImageKeys.includes(normalizedMugicName);

        if (existingIsSynced) {
          if (mugic.fileName !== mugic.name) {
            await updateMugicById(mugic.id, {
              name: mugic.name,
              fileName: mugic.name,
              rarity: mugic.rarity,
              imageFileId: mugic.imageFileId,
              tribes: mugic.tribes,
              cost: mugic.cost,
              abilities: mugic.abilities,
            });
            fileNameUpdatedCount++;
          }

          processedCount++;
          usedImageIds.add(mugic.imageFileId);
          continue;
        }

        const newPath = await renameMugicImage(mugic.imageFileId, mugic.name);

        await updateMugicById(mugic.id, {
          name: mugic.name,
          fileName: mugic.name,
          rarity: mugic.rarity,
          imageFileId: newPath,
          tribes: mugic.tribes,
          cost: mugic.cost,
          abilities: mugic.abilities,
        });

        processedCount++;
        renamedCount++;
        usedImageIds.add(newPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        errors.push(`Erro ao processar ${mugic.name}: ${errorMessage}`);
      }
    }

    images = await listAllMugicImages();
    imageById = new Map(images.map((img) => [img.id, img]));
    const imageIndex = buildImageIndex(images, usedImageIds);

    for (const mugic of mugics) {
      try {
        if (mugic.imageFileId && usedImageIds.has(mugic.imageFileId)) {
          continue;
        }

        const normalizedMugicName = normalizeLookup(mugic.name);
        const normalizedFileName = mugic.fileName ? normalizeLookup(removeExtension(mugic.fileName)) : null;
        const normalizedSeedFileName = seedFileNameByMugicName.get(normalizedMugicName) ?? null;

        const lookupKeys = [normalizedMugicName, normalizedFileName, normalizedSeedFileName].filter(
          (value): value is string => Boolean(value),
        );

        const matchingImage = lookupKeys
          .map((key) => imageIndex.get(key)?.[0])
          .find((image): image is { name: string; id: string } => Boolean(image));

        if (!matchingImage) {
          notFoundCount++;
          errors.push(`Imagem não encontrada para: ${mugic.name}`);
          continue;
        }

        if (!mugic.imageFileId) {
          await updateMugicById(mugic.id, {
            name: mugic.name,
            fileName: mugic.name,
            rarity: mugic.rarity,
            imageFileId: matchingImage.id,
            tribes: mugic.tribes,
            cost: mugic.cost,
            abilities: mugic.abilities,
          });

          processedCount++;
          updatedCount++;
          usedImageIds.add(matchingImage.id);
          continue;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        errors.push(`Erro ao processar ${mugic.name}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído. ${processedCount} mugics processados, ${renamedCount} imagens renomeadas, ${updatedCount} UUIDs salvos, ${fileNameUpdatedCount} fileName sincronizados.`,
      processed: processedCount,
      renamed: renamedCount,
      updated: updatedCount,
      fileNameUpdated: fileNameUpdatedCount,
      notFound: notFoundCount,
      totalImages: images.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar mugics";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
