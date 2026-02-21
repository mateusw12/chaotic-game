import type {
  AwardCardToDeckRequestDto,
  AwardCardToDeckResponseDto,
  CreateDeckRequestDto,
  DeckMutationResponseDto,
  DeleteDeckResponseDto,
  ListDeckOverviewResponseDto,
  UpdateDeckRequestDto,
} from "@/dto/deck";
import { ApiClient } from "@/lib/api/api-client";

export class DecksService {
  static async getOverview() {
    const data = await ApiClient.get<ListDeckOverviewResponseDto>("/users/decks");

    if (!data.success || !data.overview) {
      throw new Error(data.message ?? "Não foi possível carregar os decks.");
    }

    return data.overview;
  }

  static async createDeck(payload: CreateDeckRequestDto) {
    const data = await ApiClient.post<DeckMutationResponseDto, CreateDeckRequestDto>("/users/decks", payload);

    if (!data.success || !data.deck) {
      throw new Error(data.message ?? "Não foi possível criar o deck.");
    }

    return data.deck;
  }

  static async updateDeck(deckId: string, payload: UpdateDeckRequestDto) {
    const data = await ApiClient.patch<DeckMutationResponseDto, UpdateDeckRequestDto>(`/users/decks/${deckId}`, payload);

    if (!data.success || !data.deck) {
      throw new Error(data.message ?? "Não foi possível atualizar o deck.");
    }

    return data.deck;
  }

  static async removeDeck(deckId: string) {
    const data = await ApiClient.delete<DeleteDeckResponseDto>(`/users/decks/${deckId}`);

    if (!data.success) {
      throw new Error(data.message ?? "Não foi possível remover o deck.");
    }

    return data;
  }

  static async awardCardToDeck(payload: AwardCardToDeckRequestDto) {
    const data = await ApiClient.post<AwardCardToDeckResponseDto, AwardCardToDeckRequestDto>("/users/decks/award", payload);

    if (!data.success) {
      throw new Error(data.message ?? "Não foi possível conceder carta ao deck.");
    }

    return data;
  }
}
