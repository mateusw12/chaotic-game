import { NextResponse } from 'next/server';
import creatures from '@/components/data/creatures.json';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/supabase';
import { getSupabaseAdminClient } from '@/lib/supabase/storage';
import { getProgressionEventsTableName } from '@/lib/supabase/core';

function pickRarity() {
  // legacy helper used for individual card picks (lower rarities heavier)
  const roll = Math.random() * 100;
  if (roll < 3) return 'ultra_rara';
  if (roll < 15) return 'super_rara';
  if (roll < 40) return 'rara';
  return 'comum';
}

function pickPackRarityByLeague(league?: string | null) {
  // default probabilities
  let weights = { rara: 50, super_rara: 30, ultra_rara: 20 };

  const slug = (league || '').toLowerCase();

  // bronze/silver/gold -> higher chance of 'rara'
  if (slug === 'bronze' || slug === 'silver' || slug === 'gold') {
    weights = { rara: 60, super_rara: 30, ultra_rara: 10 };
  }

  // platinum/diamond -> higher chance of 'super_rara'
  if (slug === 'platinum' || slug === 'diamond') {
    weights = { rara: 30, super_rara: 60, ultra_rara: 10 };
  }

  // champion/legend -> higher chance of 'ultra_rara'
  if (slug === 'champion' || slug === 'legend') {
    weights = { rara: 10, super_rara: 30, ultra_rara: 60 };
  }

  const r = Math.random() * 100;
  if (r < weights.rara) return 'rara';
  if (r < weights.rara + weights.super_rara) return 'super_rara';
  return 'ultra_rara';
}

function getRandomUnique(items: any[], count: number) {
  const copy = [...items];
  const result: any[] = [];
  while (result.length < count && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(i, 1)[0]);
  }
  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const count = parseInt(url.searchParams.get('count') || '3', 10) || 3;
  const isPack = url.searchParams.get('pack') === '1' || url.searchParams.get('pack') === 'true';
  const requestedRarity = url.searchParams.get('rarity') || null;

  const selected: any[] = [];

  const available = creatures as any[];

  if (isPack) {
    // if client requested only metadata (count === 0), return chosen pack rarity and image
    const packImageMap: Record<string, string> = {
      rara: '/assets/codex-trials/bonus/rare.png',
      super_rara: '/assets/codex-trials/bonus/super_rare.png',
      ultra_rara: '/assets/codex-trials/bonus/ultra_rare.png',
    };

    // decide pack rarity (allow overriding via query)
    const packRarity = requestedRarity ?? pickPackRarityByLeague(url.searchParams.get('league'));

    if (count === 0) {
      // check whether the current user already claimed this pack for the league
      let alreadyClaimed = false;
      try {
        const session = await auth();
        const email = session?.user?.email;
        if (email) {
          const user = await getUserByEmail(email);
          if (user) {
            const supabase = getSupabaseAdminClient();
            const eventsTable = getProgressionEventsTableName();
            const referenceId = `codex-pack:${(url.searchParams.get('league') || '').toLowerCase()}`;
            const { data: existing } = await supabase
              .from(eventsTable)
              .select('id')
              .eq('user_id', user.id)
              .eq('reference_id', referenceId)
              .limit(1)
              .maybeSingle();

            if (existing) alreadyClaimed = true;
          }
        }
      } catch (e) {
        // ignore auth/check errors and default to not claimed
        // eslint-disable-next-line no-console
        console.error('Erro ao checar resgate do pacote:', e);
      }

      return NextResponse.json({ packRarity, packImage: packImageMap[packRarity] || '/assets/codex-trials/bonus/pack.png', cards: [], claimed: alreadyClaimed });
    }

    // try to pick `count` cards from that rarity
    let pool = available.filter((c) => (c.rarity || 'comum') === packRarity);
    // if not enough, fall back to any
    if (pool.length < count) pool = available;

    const picks = getRandomUnique(pool, count);
    const result = picks.map((c) => ({
      id: c.id,
      name: c.name,
      rarity: c.rarity || 'comum',
      imageUrl: c.imageUrl || null,
      fileName: c.fileName || null,
    }));

    // extras: starting from platinum, award an extra random location; champion/legend also award a random mugic
    const leagueParam = (url.searchParams.get('league') || '').toLowerCase();
    let bonusLocation = null;
    let bonusMugic = null;

    try {
      // load locations and mugic datasets lazily from data files
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const locations = require('@/components/data/locations.json') as any[];
      // pick a random location for platinum and above
      if (leagueParam === 'platinum' || leagueParam === 'diamond' || leagueParam === 'champion' || leagueParam === 'legend') {
        const loc = locations[Math.floor(Math.random() * locations.length)];
        if (loc) {
          bonusLocation = { id: loc.id, name: loc.name, imageUrl: loc.image_url || null };
        }
      }

      // pick mugic for champion/legend
      if (leagueParam === 'champion' || leagueParam === 'legend') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mugics = require('@/components/data/mujic.json') as any[];
        const mg = mugics[Math.floor(Math.random() * mugics.length)];
        if (mg) {
          bonusMugic = { id: mg.id, name: mg.name, imageUrl: mg.image_url || null };
        }
      }
    } catch (e) {
      // ignore dataset load errors and skip extras
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar extras do pacote:', e);
    }

    return NextResponse.json({ packRarity, packImage: packImageMap[packRarity] || '/assets/codex-trials/bonus/pack.png', cards: result, bonusLocation, bonusMugic });
  }

  const result = selected.map((c) => ({
    id: c.id,
    name: c.name,
    rarity: c.rarity || 'comum',
    imageUrl: c.imageUrl || null,
    fileName: c.fileName || null,
  }));

  return NextResponse.json({ cards: result });
}
