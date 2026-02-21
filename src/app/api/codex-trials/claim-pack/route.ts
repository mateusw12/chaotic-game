import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, applyProgressionEvent } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase/storage';
import { getProgressionEventsTableName } from '@/lib/supabase/core';

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ success: false, message: 'Usuário não autenticado.' }, { status: 401 });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return NextResponse.json({ success: false, message: 'Usuário não encontrado.' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({} as { league?: string }));
    const league = (body.league || '').toLowerCase();
    const referenceId = `codex-pack:${league}`;

    // attempt to create a claim event; if an event with same reference exists, treat as conflict
    // applyProgressionEvent will insert into progression_events (and create progression row if needed)
    // first check if any event with same reference exists
    // we query progression_events directly to avoid double-insert race
    // NOTE: use admin client via progression utilities inside applyProgressionEvent

    // check existing claim/award events for this reference to prevent duplicates
    try {
      const supabase = getSupabaseAdminClient();
      const eventsTable = getProgressionEventsTableName();
      const { data: existing } = await supabase
        .from(eventsTable)
        .select('id')
        .eq('user_id', user.id)
        .eq('reference_id', referenceId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: false, message: 'Pacote já resgatado.' }, { status: 409 });
      }
    } catch (e) {
      // ignore check errors and continue to try to write claim
      // eslint-disable-next-line no-console
      console.error('Erro ao checar resgates existentes:', e);
    }

    // call applyProgressionEvent to record the claim (use an allowed source)
    await applyProgressionEvent({
      userId: user.id,
      source: 'shop_pack_purchase',
      xpDelta: 0,
      coinsDelta: 0,
      diamondsDelta: 0,
      quantity: 0,
      referenceId,
      metadata: { league },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // if applyProgressionEvent failed due to unique constraint on reference_id, return 409
    const message = err instanceof Error ? err.message : 'Erro ao registrar claim.';
    // best-effort: if message contains 'reference_id' or 'duplicate', map to 409
    if (typeof message === 'string' && /reference_id|duplicate|unique/i.test(message)) {
      return NextResponse.json({ success: false, message: 'Pacote já resgatado.' }, { status: 409 });
    }

    console.error('Erro ao registrar claim do pacote:', err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
