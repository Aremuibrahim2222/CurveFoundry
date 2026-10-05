"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PresetRow, listPresets } from "@/lib/supabase/queries";
import { CATEGORY_LABELS, AssetCategory } from "@/lib/curve/definition";
import { shorten } from "@/lib/solana/utils";

export default function Presets() {
  const [rows, setRows] = useState<PresetRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { listPresets().then(setRows).catch((e) => setErr(e.message)); }, []);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Config presets</h1><Link href="/design" className="btn-ghost">Create one</Link></div>
      {err && <p className="text-sm text-down">{err}</p>}
      {!rows.length && !err && <p className="text-sm text-mute">No public presets yet. Design a market and use “Save as preset”. Requires Supabase.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <div key={p.id} className="card space-y-2 p-4">
            <div className="flex justify-between"><h3 className="font-medium">{p.name}</h3><span className="text-xs text-mute">{p.price_sol > 0 ? `${p.price_sol} SOL` : "Free"}</span></div>
            <p className="text-xs text-mute">{p.description ?? "No description"}</p>
            <dl className="grid grid-cols-2 gap-1 text-xs">
              <dt className="text-mute">Category</dt><dd>{CATEGORY_LABELS[p.category as AssetCategory] ?? p.category}</dd>
              <dt className="text-mute">Curve</dt><dd>{p.definition.preset}</dd>
              <dt className="text-mute">Fee</dt><dd>{p.definition.baseFee.startingBps}→{p.definition.baseFee.endingBps} bps</dd>
              <dt className="text-mute">Graduation cap</dt><dd>{p.definition.migrationMarketCap} {p.definition.quote}</dd>
              <dt className="text-mute">Creator</dt><dd>{shorten(p.owner)}</dd>
              <dt className="text-mute">Used</dt><dd>{p.usage_count}</dd>
            </dl>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-mute">Paid presets are metadata only in this MVP; no on-chain payment is wired.</p>
    </div>
  );
}
