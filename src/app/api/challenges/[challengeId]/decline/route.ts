import { NextResponse } from "next/server";
import type { ChallengeActionResponseDto } from "@/dto/challenge";
import { auth } from "@/lib/auth";
import { declineChallengeForUser, ensureUserWalletInSupabase, getUserByEmail } from "@/lib/supabase";

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
    const challenge = await declineChallengeForUser(user.id, challengeId);
    const wallet = await ensureUserWalletInSupabase(user.id);

    const response: ChallengeActionResponseDto = {
      success: true,
      challenge,
      wallet: {
        coins: wallet.coins,
        diamonds: wallet.diamonds,
      },
      awardedCards: [],
      message: "Desafio recusado.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ChallengeActionResponseDto = {
      success: false,
      challenge: null,
      wallet: null,
      awardedCards: [],
      message: error instanceof Error ? error.message : "Erro ao recusar desafio.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
