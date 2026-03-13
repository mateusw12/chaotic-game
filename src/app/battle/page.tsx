"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BattleScreen } from "@/components/battle/battle-screen";
import type { BattleFormat } from "@/components/battle/types";

function normalizeFormat(value: string | null): BattleFormat {
  if (value === "1" || value === "1x1") {
    return 1;
  }

  if (value === "3" || value === "3x3") {
    return 3;
  }

  if (value === "6" || value === "6x6" || value === "5x5") {
    return 6;
  }

  if (value === "10" || value === "10x10" || value === "7x7") {
    return 10;
  }

  return 3;
}

export default function BattlePage() {
  const searchParams = useSearchParams();
  const format = useMemo(() => normalizeFormat(searchParams.get("format")), [searchParams]);
  const deckId = useMemo(() => searchParams.get("deckId"), [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-4 pt-3">
        <Link href="/" className="text-sm text-slate-300 underline">← Voltar</Link>
      </div>
      <BattleScreen initialFormat={format} initialDeckId={deckId} />
    </div>
  );
}
