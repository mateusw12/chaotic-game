import { CreatureTribe, CardRarity } from "@/dto/creature";
import { UserCardType } from "@/dto/progression";
import { StorePackDto, StoreCurrency } from "@/dto/store";
import { PACK_IMAGE_BY_KEY, PACK_IMAGE_FALLBACK, CURRENCY_FACTOR } from "./store-view.constants";

export function getEnumDescription(value: UserCardType | CreatureTribe | CardRarity): string {
  const map: Record<string, string> = {
    creature: "Criaturas",
    location: "Locais",
    mugic: "Mugic",
    battlegear: "Equipamentos",
    attack: "Ataques",
    overworld: "Outro Mundo",
    underworld: "Submundo",
    mipedian: "Mipedian",
    marrillian: "M'arrillian",
    danian: "Danian",
    ancient: "Antigos",
    comum: "Comum",
    incomum: "Incomum",
    rara: "Rara",
    super_rara: "Super Rara",
    ultra_rara: "Ultra Rara",
  };

  return map[value] ?? value;
}

export function getCurrencySymbol(currency: StorePackDto["currency"]) {
  return currency === "coins" ? "🪙" : "💎";
}

export function normalizePackKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export function resolvePackImage(pack: StorePackDto) {
  if (pack.imageUrl) {
    return pack.imageUrl;
  }

  const tribeCandidates = pack.allowedTribes.map((tribe) => normalizePackKey(tribe));
  for (const tribeCandidate of tribeCandidates) {
    if (PACK_IMAGE_BY_KEY[tribeCandidate]) {
      return PACK_IMAGE_BY_KEY[tribeCandidate];
    }
  }

  const candidates = [
    normalizePackKey(pack.name),
    ...tribeCandidates,
    ...pack.cardTypes.map((type) => normalizePackKey(type)),
  ];

  for (const candidate of candidates) {
    if (candidate.includes("marrillian") || candidate.includes("marrilian")) {
      return PACK_IMAGE_BY_KEY.marrillian;
    }
    if (candidate.includes("mipedian") || candidate.includes("mipeadian")) {
      return PACK_IMAGE_BY_KEY.mipedian;
    }
    if (candidate.includes("location") || candidate.includes("local")) {
      return PACK_IMAGE_BY_KEY.locations;
    }

    if (PACK_IMAGE_BY_KEY[candidate]) {
      return PACK_IMAGE_BY_KEY[candidate];
    }
  }

  return PACK_IMAGE_FALLBACK;
}

export function ensureDualCurrencyOptions(pack: StorePackDto) {
  const optionsByCurrency = new Map<StoreCurrency, number>();

  for (const option of pack.priceOptions) {
    optionsByCurrency.set(option.currency, option.price);
  }

  if (pack.currency && pack.price > 0 && !optionsByCurrency.has(pack.currency)) {
    optionsByCurrency.set(pack.currency, pack.price);
  }

  const baseCoins = optionsByCurrency.get("coins")
    ?? (optionsByCurrency.get("diamonds") ? Math.max(1, Math.round((optionsByCurrency.get("diamonds") ?? 1) * CURRENCY_FACTOR)) : null)
    ?? (pack.currency === "coins" ? pack.price : Math.max(1, Math.round(pack.price * CURRENCY_FACTOR)));

  const baseDiamonds = optionsByCurrency.get("diamonds")
    ?? (optionsByCurrency.get("coins") ? Math.max(1, Math.round((optionsByCurrency.get("coins") ?? 1) / CURRENCY_FACTOR)) : null)
    ?? (pack.currency === "diamonds" ? pack.price : Math.max(1, Math.round(pack.price / CURRENCY_FACTOR)));

  return [
    { currency: "coins" as const, price: Math.max(1, baseCoins) },
    { currency: "diamonds" as const, price: Math.max(1, baseDiamonds) },
  ];
}
