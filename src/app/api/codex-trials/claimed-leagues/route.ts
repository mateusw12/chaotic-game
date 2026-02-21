import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase/storage';
import { getProgressionEventsTableName } from '@/lib/supabase/core';

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ success: false, claimed: [] }, { status: 200 });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return NextResponse.json({ success: false, claimed: [] }, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const eventsTable = getProgressionEventsTableName();

    const { data } = await supabase
      .from(eventsTable)
      .select('reference_id')
      .eq('user_id', user.id)
      .in('source', ['shop_pack_purchase', 'codex_pack_claim', 'card_awarded'])
      .order('created_at', { ascending: false })
      .limit(200);

    const claimed: string[] = (data ?? [])
      .map((r: any) => (r.reference_id ?? '').toString())
      .filter(Boolean)
      .filter((ref: string) => ref.startsWith('codex-pack:'))
      .map((ref: string) => ref.replace(/^codex-pack:/, '').toLowerCase());

    return NextResponse.json({ success: true, claimed });
  } catch (e) {
    // on error return empty list
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar ligas resgatadas:', e);
    return NextResponse.json({ success: false, claimed: [] }, { status: 200 });
  }
}
