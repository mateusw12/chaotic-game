import { NextResponse } from "next/server";
import { listBattleGear, updateBattleGearById } from "@/lib/supabase/battlegear";
import { listAllBattlegearImages, renameBattlegearImage } from "@/lib/supabase/storage";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST() {
  try {
    const battleGearList = await listBattleGear();

    if (battleGearList.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhum battlegear encontrado.", processed: 0, renamed: 0 });
    }

    const images = await listAllBattlegearImages();

    if (images.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma imagem encontrada no storage.", processed: 0, renamed: 0, imageList: [] });
    }

    let processedCount = 0;
    let renamedCount = 0;
    let updatedCount = 0;
    let fileNameUpdatedCount = 0;
    const errors: string[] = [];

    for (const battleGear of battleGearList) {
      try {
        if (battleGear.imageFileId) {
          const currentFileName = battleGear.imageFileId.split("/").pop();
          const expectedFileName = normalizeName(battleGear.name);

          if (currentFileName && currentFileName.startsWith(expectedFileName)) {
            if (battleGear.fileName !== battleGear.name) {
              await updateBattleGearById(battleGear.id, {
                name: battleGear.name,
                fileName: battleGear.name,
                rarity: battleGear.rarity,
                imageFileId: battleGear.imageFileId,
                allowedTribes: battleGear.allowedTribes,
                allowedCreatureIds: battleGear.allowedCreatureIds,
                abilities: battleGear.abilities,
              });
              fileNameUpdatedCount++;
            }

            processedCount++;
            continue;
          }
        }

        const normalizedBattleGearName = normalizeName(battleGear.name);
        const normalizedFileName = battleGear.fileName ? normalizeName(battleGear.fileName) : null;

        const matchingImage = images.find((img) => {
          const imgName = normalizeName(img.name);
          return imgName.includes(normalizedBattleGearName) || (normalizedFileName && imgName.includes(normalizedFileName));
        });

        if (!matchingImage) {
          errors.push(`Imagem não encontrada para: ${battleGear.name}`);
          continue;
        }

        if (!battleGear.imageFileId) {
          await updateBattleGearById(battleGear.id, {
            name: battleGear.name,
            fileName: battleGear.name,
            rarity: battleGear.rarity,
            imageFileId: matchingImage.id,
            allowedTribes: battleGear.allowedTribes,
            allowedCreatureIds: battleGear.allowedCreatureIds,
            abilities: battleGear.abilities,
          });

          processedCount++;
          updatedCount++;
          continue;
        }

        const newPath = await renameBattlegearImage(matchingImage.id, battleGear.name);

        await updateBattleGearById(battleGear.id, {
          name: battleGear.name,
          fileName: battleGear.name,
          rarity: battleGear.rarity,
          imageFileId: newPath,
          allowedTribes: battleGear.allowedTribes,
          allowedCreatureIds: battleGear.allowedCreatureIds,
          abilities: battleGear.abilities,
        });

        processedCount++;
        renamedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        errors.push(`Erro ao processar ${battleGear.name}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído. ${processedCount} battlegears processados, ${renamedCount} imagens renomeadas, ${updatedCount} UUIDs salvos, ${fileNameUpdatedCount} fileName sincronizados.`,
      processed: processedCount,
      renamed: renamedCount,
      updated: updatedCount,
      fileNameUpdated: fileNameUpdatedCount,
      totalImages: images.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar battlegear";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
