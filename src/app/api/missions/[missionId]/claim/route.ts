import { NextResponse } from "next/server";
import type { ClaimMissionResponseDto } from "@/dto/mission";
import { auth } from "@/lib/auth";
import { claimMissionRewardForUser, getUserByEmail } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    missionId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: ClaimMissionResponseDto = {
      success: false,
      mission: null,
      awardedCard: null,
      progression: null,
      wallet: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: ClaimMissionResponseDto = {
        success: false,
        mission: null,
        awardedCard: null,
        progression: null,
        wallet: null,
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const { missionId } = await context.params;
    const result = await claimMissionRewardForUser(user.id, missionId);

    const response: ClaimMissionResponseDto = {
      success: true,
      mission: result.mission,
      awardedCard: result.awardedCard,
      progression: result.progression,
      wallet: result.wallet,
      message: "Recompensa da missão resgatada com sucesso.",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ClaimMissionResponseDto = {
      success: false,
      mission: null,
      awardedCard: null,
      progression: null,
      wallet: null,
      message: error instanceof Error ? error.message : "Erro ao resgatar missão.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
