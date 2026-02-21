import { NextResponse } from "next/server";
import type { RegisterCardAwardRequestDto, ProgressionMutationResponseDto } from "@/dto/progression";
import { auth } from "@/lib/auth";
import { getUserByEmail, registerCardAward } from "@/lib/supabase";

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
    const body = await request
      .json()
      .catch(() => ({} as Partial<RegisterCardAwardRequestDto>));

    if (!body.cardId || !body.cardType || !body.rarity) {
      const response: ProgressionMutationResponseDto = {
        success: false,
        progression: null,
        wallet: null,
        message: "Informe cardId, cardType e rarity.",
      };

      return NextResponse.json(response, { status: 400 });
    }

    const result = await registerCardAward({
      userId: user.id,
      cardType: body.cardType as RegisterCardAwardRequestDto["cardType"],
      cardId: String(body.cardId ?? ""),
      rarity: body.rarity as RegisterCardAwardRequestDto["rarity"],
      quantity: body.quantity,
      referenceId: body.referenceId,
    });

    const response: ProgressionMutationResponseDto = {
      success: true,
      progression: result.progression,
      wallet: result.wallet,
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
