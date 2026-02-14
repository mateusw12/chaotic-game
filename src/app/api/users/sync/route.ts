import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  type SaveLoggedUserRequestDto,
  type SaveLoggedUserResponseDto,
} from "@/dto/user/user.dto";
import { saveLoggedUserInSupabase } from "@/lib/supabase/supabase";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    const response: SaveLoggedUserResponseDto = {
      success: false,
      user: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  const body = await request
    .json()
    .catch(() => ({} as Partial<SaveLoggedUserRequestDto>));

  const payload: SaveLoggedUserRequestDto = {
    provider: body.provider ?? "google",
    providerAccountId: body.providerAccountId ?? session.user.email,
    email: session.user.email,
    name: body.name ?? session.user.name ?? null,
    imageUrl: body.imageUrl ?? session.user.image ?? null,
  };

  try {
    const user = await saveLoggedUserInSupabase(payload);

    const response: SaveLoggedUserResponseDto = {
      success: true,
      user,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: SaveLoggedUserResponseDto = {
      success: false,
      user: null,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao salvar usuário no Supabase.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
