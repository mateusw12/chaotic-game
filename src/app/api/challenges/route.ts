import { NextResponse } from "next/server";
import type { GetChallengesResponseDto } from "@/dto/challenge";
import { auth } from "@/lib/auth";
import { getChallengesOverviewForUser, getUserByEmail } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: GetChallengesResponseDto = {
      success: false,
      overview: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: GetChallengesResponseDto = {
        success: false,
        overview: null,
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const overview = await getChallengesOverviewForUser(user.id);

    const response: GetChallengesResponseDto = {
      success: true,
      overview,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: GetChallengesResponseDto = {
      success: false,
      overview: null,
      message: error instanceof Error ? error.message : "Erro ao carregar desafios.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
