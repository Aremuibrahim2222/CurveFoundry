export default function Progress({ pct, graduated }: { pct: number; graduated?: boolean }) {
  const p = Math.max(0, Math.min(100, pct));
  const label = graduated ? "GRADUATED" : p >= 85 ? "NEAR GRADUATION" : null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-mute">
        <span>Bonding curve → DAMM v2</span>
        <span className="font-mono text-zinc-200">{graduated ? "100.0" : p.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-edge"><div className="h-full rounded-full bg-gradient-to-r from-violet to-sky" style={{ width: `${graduated ? 100 : p}%` }} /></div>
      {label && <div className="mt-2 inline-block rounded bg-violet/20 px-2 py-0.5 text-xs font-semibold text-violet">{label}</div>}
    </div>
  );
}
