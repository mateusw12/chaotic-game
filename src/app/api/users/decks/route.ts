import { NextResponse } from "next/server";
import type {
  CreateDeckRequestDto,
  DeckMutationResponseDto,
  ListDeckOverviewResponseDto,
} from "@/dto/deck";
import { auth } from "@/lib/auth";
import { createUserDeck, getUserByEmail, getUserDeckOverview } from "@/lib/supabase";

function parsePositiveInteger(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") {
    return undefined;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    return undefined;
  }

  return value;
}

export async function GET(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: ListDeckOverviewResponseDto = {
      success: false,
      overview: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("pageSize");

  const page = parsePositiveInteger(rawPage);
  const pageSize = parsePositiveInteger(rawPageSize);

  if (rawPage !== null && page === undefined) {
    const response: ListDeckOverviewResponseDto = {
      success: false,
      overview: null,
      message: "Parâmetro 'page' inválido.",
    };

    return NextResponse.json(response, { status: 400 });
  }

  if (rawPageSize !== null && pageSize === undefined) {
    const response: ListDeckOverviewResponseDto = {
      success: false,
      overview: null,
      message: "Parâmetro 'pageSize' inválido.",
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: ListDeckOverviewResponseDto = {
        success: false,
        overview: null,
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const overview = await getUserDeckOverview(
      user.id,
      page !== undefined || pageSize !== undefined
        ? { page, pageSize }
        : undefined,
    );

    const response: ListDeckOverviewResponseDto = {
      success: true,
      overview,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ListDeckOverviewResponseDto = {
      success: false,
      overview: null,
      message: error instanceof Error ? error.message : "Erro ao carregar decks.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    const response: DeckMutationResponseDto = {
      success: false,
      deck: null,
      message: "Usuário não autenticado.",
    };

    return NextResponse.json(response, { status: 401 });
  }

  const body = await request.json().catch(() => ({} as Partial<CreateDeckRequestDto>));

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      const response: DeckMutationResponseDto = {
        success: false,
        deck: null,
        message: "Usuário não encontrado.",
      };

      return NextResponse.json(response, { status: 404 });
    }

    const deck = await createUserDeck(user.id, {
      name: String(body.name ?? ""),
    });

    const response: DeckMutationResponseDto = {
      success: true,
      deck,
      message: "Deck criado com sucesso.",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: DeckMutationResponseDto = {
      success: false,
      deck: null,
      message: error instanceof Error ? error.message : "Erro ao criar deck.",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
