import { NextResponse } from "next/server";
import type { GetMissionsResponseDto } from "@/dto/mission";
import { auth } from "@/lib/auth";
import { getMissionsOverviewForUser, getUserByEmail } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: GetMissionsResponseDto = {
      success: false,
      overview: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: GetMissionsResponseDto = {
        success: false,
        overview: null,
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const overview = await getMissionsOverviewForUser(user.id);

    const response: GetMissionsResponseDto = {
      success: true,
      overview,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: GetMissionsResponseDto = {
      success: false,
      overview: null,
      message: error instanceof Error ? error.message : "Erro ao carregar missões.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
