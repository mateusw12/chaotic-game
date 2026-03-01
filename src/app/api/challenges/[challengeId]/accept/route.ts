import { NextResponse } from "next/server";
import type { ChallengeActionResponseDto } from "@/dto/challenge";
import { auth } from "@/lib/auth";
import { acceptChallengeForUser, getUserByEmail } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    challengeId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: ChallengeActionResponseDto = {
      success: false,
      challenge: null,
      wallet: null,
      awardedCards: [],
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: ChallengeActionResponseDto = {
        success: false,
        challenge: null,
        wallet: null,
        awardedCards: [],
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const { challengeId } = await context.params;

    const result = await acceptChallengeForUser(user.id, challengeId);

    const response: ChallengeActionResponseDto = {
      success: true,
      challenge: result.challenge,
      wallet: result.wallet,
      awardedCards: result.awardedCards,
      message: result.challenge.status === "won" ? "Desafio vencido!" : "Você perdeu este desafio.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ChallengeActionResponseDto = {
      success: false,
      challenge: null,
      wallet: null,
      awardedCards: [],
      message: error instanceof Error ? error.message : "Erro ao aceitar desafio.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
