import { NextResponse } from "next/server";
import { listLocations, updateLocationById } from "@/lib/supabase/locations";
import { listAllLocationImages, renameLocationImage } from "@/lib/supabase/storage";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST() {
  try {
    const locations = await listLocations();
    console.log(`[SYNC] Total de locations encontradas: ${locations.length}`);

    if (locations.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma location encontrada.", processed: 0, renamed: 0 });
    }

    const images = await listAllLocationImages();
    console.log(`[SYNC] Total de imagens no storage: ${images.length}`);

    if (images.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma imagem encontrada no storage.", processed: 0, renamed: 0, imageList: [] });
    }

    let processedCount = 0;
    let renamedCount = 0;
    let updatedCount = 0;
    let fileNameUpdatedCount = 0;
    const errors: string[] = [];

    for (const location of locations) {
      try {
        if (location.imageFileId) {
          const currentFileName = location.imageFileId.split("/").pop();
          const expectedFileName = normalizeName(location.name);

          if (currentFileName && currentFileName.startsWith(expectedFileName)) {
            if (location.fileName !== location.name) {
              await updateLocationById(location.id, {
                name: location.name,
                fileName: location.name,
                rarity: location.rarity,
                imageFileId: location.imageFileId,
                initiativeElements: location.initiativeElements,
                tribes: location.tribes,
                abilities: location.abilities,
              });
              fileNameUpdatedCount++;
            }
            processedCount++;
            continue;
          }
        }

        const normalizedLocationName = normalizeName(location.name);
        const normalizedFileName = location.fileName ? normalizeName(location.fileName) : null;

        let matchingImage = images.find((img) => {
          const imgName = normalizeName(img.name);
          return (
            imgName.includes(normalizedLocationName) ||
            (normalizedFileName && imgName.includes(normalizedFileName))
          );
        });

        if (!matchingImage) {
          console.warn(`[SYNC] Imagem não encontrada para: ${location.name}`);
          errors.push(`Imagem não encontrada para: ${location.name}`);
          continue;
        }

        if (!location.imageFileId) {
          await updateLocationById(location.id, {
            name: location.name,
            fileName: location.name,
            rarity: location.rarity,
            imageFileId: matchingImage.id,
            initiativeElements: location.initiativeElements,
            tribes: location.tribes,
            abilities: location.abilities,
          });

          processedCount++;
          updatedCount++;
          continue;
        }

        const newPath = await renameLocationImage(matchingImage.id, location.name);

        await updateLocationById(location.id, {
          name: location.name,
          fileName: location.name,
          rarity: location.rarity,
          imageFileId: newPath,
          initiativeElements: location.initiativeElements,
          tribes: location.tribes,
          abilities: location.abilities,
        });

        processedCount++;
        renamedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`[SYNC] Erro ao processar ${location.name}:`, errorMessage);
        errors.push(`Erro ao processar ${location.name}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído. ${processedCount} locations processadas, ${renamedCount} imagens renomeadas, ${updatedCount} UUIDs salvos, ${fileNameUpdatedCount} fileName sincronizados.`,
      processed: processedCount,
      renamed: renamedCount,
      updated: updatedCount,
      fileNameUpdated: fileNameUpdatedCount,
      totalImages: images.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erro ao sincronizar imagens:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar locations";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
