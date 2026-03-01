import type { CardRarity } from "@/dto/creature";
import type { UserCardType } from "@/dto/progression";

export function getCardTypeLabel(type: UserCardType | string): string {
  if (type === "creature") {
    return "Criatura";
  }

  if (type === "attack") {
    return "Ataque";
  }

  if (type === "location") {
    return "Local";
  }

  if (type === "mugic") {
    return "Mugic";
  }

  if (type === "battlegear") {
    return "Equipamento";
  }

  return "Carta";
}

export function getCardRarityLabel(rarity: CardRarity | string): string {
  if (rarity === "super_rara") {
    return "Super Rara";
  }

  if (rarity === "rara") {
    return "Rara";
  }

  if (rarity === "ultra_rara") {
    return "Ultra Rara";
  }

  if (rarity === "incomum") {
    return "Incomum";
  }

  return "Comum";
}
