import { NextResponse } from "next/server";
import type { AwardCardToDeckRequestDto, AwardCardToDeckResponseDto } from "@/dto/deck";
import type { ProgressionMutationResponseDto } from "@/dto/progression";
import { auth } from "@/lib/auth";
import { getUserByEmail, registerCardAward } from "@/lib/supabase";
import { getUserDeckOverview, updateUserDeck } from "@/lib/supabase";
import { getSupabaseAdminClient } from "@/lib/supabase/storage";
import { getProgressionEventsTableName } from "@/lib/supabase/core";

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: ProgressionMutationResponseDto = {
      success: false,
      progression: null,
      wallet: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    const response: ProgressionMutationResponseDto = {
      success: false,
      progression: null,
      wallet: null,
      message: "Usuário não encontrado.",
    };

    return NextResponse.json(response, { status: 404 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Partial<AwardCardToDeckRequestDto>;

    if (!body.cardId || !body.cardType || !body.rarity) {
      const response: ProgressionMutationResponseDto = {
        success: false,
        progression: null,
        wallet: null,
        message: "Informe cardId, cardType e rarity.",
      };

      return NextResponse.json(response, { status: 400 });
    }

    // if a referenceId was provided, ensure the user hasn't already claimed it
    const providedReference = (body as Partial<AwardCardToDeckRequestDto>).referenceId ?? (body.deckId ? `deck-award:${body.deckId}` : undefined);
    if (providedReference) {
      const supabase = getSupabaseAdminClient();
      const eventsTable = getProgressionEventsTableName();
      // only treat as already awarded if there's a prior 'card_awarded' event with this reference
      const { data: existingAwardEvent, error: existingErr } = await supabase
        .from(eventsTable)
        .select("id,source")
        .eq("user_id", user.id)
        .eq("reference_id", providedReference)
        .eq("source", "card_awarded")
        .limit(1)
        .maybeSingle();

      if (existingErr) {
        console.error('Erro ao checar resgate anterior:', existingErr);
      }

      if (existingAwardEvent) {
        const response: ProgressionMutationResponseDto = {
          success: false,
          progression: null,
          wallet: null,
          message: "Recompensa já resgatada.",
        };

        return NextResponse.json(response, { status: 409 });
      }
    }

    // register award in user's collection + progression
    const awardResult = await registerCardAward({
      userId: user.id,
      cardType: body.cardType as AwardCardToDeckRequestDto["cardType"],
      cardId: String(body.cardId),
      rarity: body.rarity as AwardCardToDeckRequestDto["rarity"],
      quantity: body.quantity ?? 1,
      referenceId: providedReference,
    });

    let updatedDeck = null;

    // if a deckId was provided, add the card to that deck (append)
    if (body.deckId) {
      // load current overview to find the deck cards
      const overview = await getUserDeckOverview(user.id);
      const deck = overview.decks.find((d) => d.id === body.deckId);

      const existingCards = deck?.cards ?? [];

      // create a new array with existing cards plus the awarded one
      const nextCards = [
        ...existingCards,
        {
          cardType: body.cardType,
          cardId: String(body.cardId),
          quantity: Number(body.quantity ?? 1),
        },
      ];

      updatedDeck = await updateUserDeck(user.id, body.deckId, { cards: nextCards });
    }

    const response: AwardCardToDeckResponseDto = {
      success: true,
      progression: awardResult.progression,
      wallet: awardResult.wallet,
      message: "Carta concedida com sucesso.",
      deck: updatedDeck ?? null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ProgressionMutationResponseDto = {
      success: false,
      progression: null,
      wallet: null,
      message: error instanceof Error ? error.message : "Erro ao conceder carta.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
