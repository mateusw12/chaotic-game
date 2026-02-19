import { NextResponse } from "next/server";
import { listCreatures, updateCreatureById } from "@/lib/supabase/creatures";
import { listAllCreatureImages, renameCreatureImage } from "@/lib/supabase/storage";

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
        // 1. Busca todas as creatures
        const creatures = await listCreatures();
        console.log(`[SYNC] Total de creatures encontradas: ${creatures.length}`);

        if (creatures.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Nenhuma creature encontrada.",
                processed: 0,
                renamed: 0,
            });
        }

        // 2. Busca todas as imagens do storage
        const images = await listAllCreatureImages();
        console.log(`[SYNC] Total de imagens no storage: ${images.length}`);
        console.log(`[SYNC] Primeiras 10 imagens:`, images.slice(0, 10));

        if (images.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Nenhuma imagem encontrada no storage.",
                processed: 0,
                renamed: 0,
                imageList: [],
            });
        }

        let processedCount = 0;
        let renamedCount = 0;
        let updatedCount = 0;
        let fileNameUpdatedCount = 0;
        const errors: string[] = [];

        // 3. Para cada creature, tenta encontrar e renomear sua imagem
        for (const creature of creatures) {
            try {
                // Se a creature já tem imageFileId, verifica se precisa atualizar
                if (creature.imageFileId) {
                    const currentFileName = creature.imageFileId.split("/").pop();
                    const expectedFileName = normalizeName(creature.name);

                    // Verifica se o nome atual já está correto
                    if (currentFileName && currentFileName.startsWith(expectedFileName)) {
                        // Verifica se fileName precisa ser atualizado
                        if (creature.fileName !== creature.name) {
                            await updateCreatureById(creature.id, {
                                name: creature.name,
                                fileName: creature.name,
                                rarity: creature.rarity,
                                imageFileId: creature.imageFileId,
                                tribe: creature.tribe,
                                power: creature.power,
                                courage: creature.courage,
                                speed: creature.speed,
                                wisdom: creature.wisdom,
                                mugic: creature.mugic,
                                energy: creature.energy,
                                dominantElements: creature.dominantElements,
                                supportAbilityId: creature.supportAbilityId,
                                brainwashedAbilityId: creature.brainwashedAbilityId,
                                equipmentNote: creature.equipmentNote,
                            });
                            console.log(`[SYNC] fileName atualizado para "${creature.name}" (imagem já estava correta)`);
                            fileNameUpdatedCount++;
                        } else {
                            console.log(`[SYNC] Creature "${creature.name}" já está completamente sincronizada`);
                        }
                        processedCount++;
                        continue; // Já está com o nome correto
                    }
                }

                // Busca uma imagem que corresponda ao nome da creature ou ao fileName
                const normalizedCreatureName = normalizeName(creature.name);
                const normalizedFileName = creature.fileName ? normalizeName(creature.fileName) : null;

                let matchingImage = images.find((img) => {
                    const imgName = normalizeName(img.name);
                    return (
                        imgName.includes(normalizedCreatureName) ||
                        (normalizedFileName && imgName.includes(normalizedFileName))
                    );
                });

                if (!matchingImage) {
                    console.warn(`[SYNC] Imagem não encontrada para: ${creature.name} (normalized: ${normalizedCreatureName})`);
                    errors.push(`Imagem não encontrada para: ${creature.name}`);
                    continue;
                }

                console.log(`[SYNC] Match encontrado para "${creature.name}": ${matchingImage.id}`);

                // Se a creature não tem imageFileId, apenas atualiza sem renomear
                if (!creature.imageFileId) {
                    await updateCreatureById(creature.id, {
                        name: creature.name,
                        fileName: creature.name, // Atualiza fileName com o valor de name
                        rarity: creature.rarity,
                        imageFileId: matchingImage.id,
                        tribe: creature.tribe,
                        power: creature.power,
                        courage: creature.courage,
                        speed: creature.speed,
                        wisdom: creature.wisdom,
                        mugic: creature.mugic,
                        energy: creature.energy,
                        dominantElements: creature.dominantElements,
                        supportAbilityId: creature.supportAbilityId,
                        brainwashedAbilityId: creature.brainwashedAbilityId,
                        equipmentNote: creature.equipmentNote,
                    });

                    console.log(`[SYNC] UUID salvo para "${creature.name}": ${matchingImage.id}`);
                    console.log(`[SYNC] fileName atualizado para: ${creature.name}`);
                    processedCount++;
                    updatedCount++;
                    continue;
                }

                // Renomeia a imagem para o nome da creature
                const newPath = await renameCreatureImage(matchingImage.id, creature.name);
                console.log(`[SYNC] Imagem renomeada de "${matchingImage.id}" para "${newPath}"`);

                // Atualiza o imageFileId da creature e o fileName
                await updateCreatureById(creature.id, {
                    name: creature.name,
                    fileName: creature.name, // Atualiza fileName com o valor de name
                    rarity: creature.rarity,
                    imageFileId: newPath,
                    tribe: creature.tribe,
                    power: creature.power,
                    courage: creature.courage,
                    speed: creature.speed,
                    wisdom: creature.wisdom,
                    mugic: creature.mugic,
                    energy: creature.energy,
                    dominantElements: creature.dominantElements,
                    supportAbilityId: creature.supportAbilityId,
                    brainwashedAbilityId: creature.brainwashedAbilityId,
                    equipmentNote: creature.equipmentNote,
                });

                console.log(`[SYNC] UUID atualizado e fileName sincronizado para: ${creature.name}`);
                processedCount++;
                renamedCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
                console.error(`[SYNC] Erro ao processar ${creature.name}:`, errorMessage);
                errors.push(`Erro ao processar ${creature.name}: ${errorMessage}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processamento concluído. ${processedCount} creatures processadas, ${renamedCount} imagens renomeadas, ${updatedCount} UUIDs salvos, ${fileNameUpdatedCount} fileName sincronizados.`,
            processed: processedCount,
            renamed: renamedCount,
            updated: updatedCount,
            fileNameUpdated: fileNameUpdatedCount,
            totalImages: images.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error("Erro ao sincronizar imagens:", error);

        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar creatures";

        return NextResponse.json(
            {
                success: false,
                message: errorMessage,
            },
            { status: 500 },
        );
    }
}
