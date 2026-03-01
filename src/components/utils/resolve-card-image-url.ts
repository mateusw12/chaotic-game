import type { UserCardType } from "@/dto/progression";
import { DecksService } from "@/lib/api/service";

type ResolveCardImageUrlInput = {
  cardType: UserCardType;
  cardId: string;
  initialImageUrl?: string | null;
};

let collectionCachePromise: Promise<Array<{ cardType: UserCardType; cardId: string; imageUrl: string }>> | null = null;

async function getCollectionCards() {
  if (!collectionCachePromise) {
    collectionCachePromise = DecksService.getOverview()
      .then((overview) => overview.collection)
      .catch((error) => {
        collectionCachePromise = null;
        throw error;
      });
  }

  return collectionCachePromise;
}

export async function resolveCardImageUrl({ cardType, cardId, initialImageUrl }: ResolveCardImageUrlInput): Promise<string | null> {
  if (initialImageUrl?.trim()) {
    return initialImageUrl;
  }

  const collection = await getCollectionCards();
  const matchedCard = collection.find((card) => card.cardType === cardType && card.cardId === cardId);

  return matchedCard?.imageUrl ?? null;
}
