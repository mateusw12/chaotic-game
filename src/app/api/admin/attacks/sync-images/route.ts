import { NextResponse } from "next/server";
import attacksSeed from "@/components/data/attack.json";
import { listAttacks, updateAttackById } from "@/lib/supabase/attacks";
import { listAllAttackImages, renameAttackImage } from "@/lib/supabase/storage";

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

function buildSeedFileNameByAttackName(): Map<string, string> {
  const map = new Map<string, string>();

  for (const item of attacksSeed as Array<{ name?: unknown; file_name?: unknown; fileName?: unknown }>) {
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
    const attacks = await listAttacks();
    const seedFileNameByAttackName = buildSeedFileNameByAttackName();

    if (attacks.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhum ataque encontrado.", processed: 0, renamed: 0 });
    }

    let images = await listAllAttackImages();
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

    for (const attack of attacks) {
      try {
        if (!attack.imageFileId) {
          continue;
        }

        const normalizedAttackName = normalizeLookup(attack.name);
        const existingImage = imageById.get(attack.imageFileId);

        if (!existingImage) {
          continue;
        }

        const existingImageKeys = extractImageLookupKeys(existingImage.name);
        const existingIsSynced = existingImageKeys.includes(normalizedAttackName);

        if (existingIsSynced) {
          if (attack.fileName !== attack.name) {
            await updateAttackById(attack.id, {
              name: attack.name,
              fileName: attack.name,
              rarity: attack.rarity,
              imageFileId: attack.imageFileId,
              energyCost: attack.energyCost,
              elementValues: attack.elementValues,
              abilities: attack.abilities,
            });
            fileNameUpdatedCount++;
          }

          processedCount++;
          usedImageIds.add(attack.imageFileId);
          continue;
        }

        const newPath = await renameAttackImage(attack.imageFileId, attack.name);

        await updateAttackById(attack.id, {
          name: attack.name,
          fileName: attack.name,
          rarity: attack.rarity,
          imageFileId: newPath,
          energyCost: attack.energyCost,
          elementValues: attack.elementValues,
          abilities: attack.abilities,
        });

        processedCount++;
        renamedCount++;
        usedImageIds.add(newPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        errors.push(`Erro ao processar ${attack.name}: ${errorMessage}`);
      }
    }

    images = await listAllAttackImages();
    imageById = new Map(images.map((img) => [img.id, img]));
    const imageIndex = buildImageIndex(images, usedImageIds);

    for (const attack of attacks) {
      try {
        if (attack.imageFileId && usedImageIds.has(attack.imageFileId)) {
          continue;
        }

        const normalizedAttackName = normalizeLookup(attack.name);
        const normalizedFileName = attack.fileName ? normalizeLookup(removeExtension(attack.fileName)) : null;
        const normalizedSeedFileName = seedFileNameByAttackName.get(normalizedAttackName) ?? null;

        const lookupKeys = [normalizedAttackName, normalizedFileName, normalizedSeedFileName].filter(
          (value): value is string => Boolean(value),
        );

        const matchingImage = lookupKeys
          .map((key) => imageIndex.get(key)?.[0])
          .find((image): image is { name: string; id: string } => Boolean(image));

        if (!matchingImage) {
          notFoundCount++;
          errors.push(`Imagem não encontrada para: ${attack.name}`);
          continue;
        }

        await updateAttackById(attack.id, {
          name: attack.name,
          fileName: attack.name,
          rarity: attack.rarity,
          imageFileId: matchingImage.id,
          energyCost: attack.energyCost,
          elementValues: attack.elementValues,
          abilities: attack.abilities,
        });

        processedCount++;
        updatedCount++;
        usedImageIds.add(matchingImage.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        errors.push(`Erro ao processar ${attack.name}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído. ${processedCount} attacks processados, ${renamedCount} imagens renomeadas, ${updatedCount} UUIDs salvos, ${fileNameUpdatedCount} fileName sincronizados.`,
      processed: processedCount,
      renamed: renamedCount,
      updated: updatedCount,
      fileNameUpdated: fileNameUpdatedCount,
      notFound: notFoundCount,
      totalImages: images.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar attacks";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
