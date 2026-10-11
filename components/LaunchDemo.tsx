"use client";
import { useMemo, useState } from "react";
import { PRESET_INFO } from "@/lib/curve/definition";

const STYLES = [
  { id: "steady", label: "Slow & steady" },
  { id: "long", label: "Long runway" },
  { id: "fast", label: "Quick launch" },
  { id: "thin", label: "Small start" },
] as const;

/** Hero demo: the numbers are the real preset values; the curve is an illustration of their shape only. */
export default function LaunchDemo() {
  const [id, setId] = useState<(typeof STYLES)[number]["id"]>("steady");
  const v = PRESET_INFO[id].values;
  const start = v.initialMarketCap ?? 0, grad = v.migrationMarketCap ?? 0;
  const ratio = start ? grad / start : 1;

  const { line, area, end } = useMemo(() => {
    const N = 48, x0 = 24, x1 = 376, yb = 196, h = 160;
    const pts = Array.from({ length: N + 1 }, (_, i) => {
      const t = i / N;
      const p = ratio > 1 ? (Math.pow(ratio, t) - 1) / (ratio - 1) : t;
      return [x0 + t * (x1 - x0), yb - p * h] as const;
    });
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return { line, area: `${line} L${x1},${yb} L${x0},${yb} Z`, end: pts[pts.length - 1] };
  }, [ratio]);

  return (
    <div className="glass anim-float rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] text-mute">
        <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-down/70" /><i className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><i className="h-2.5 w-2.5 rounded-full bg-up/70" /></span>
        <span>curvefoundry · interactive demo</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {STYLES.map((s) => <button key={s.id} onClick={() => setId(s.id)} className={`pill ${id === s.id ? "pill-on" : ""}`}>{s.label}</button>)}
      </div>
      <svg viewBox="0 0 400 240" className="w-full" role="img" aria-label="Illustration of the selected curve rising to its graduation point">
        <defs>
          <linearGradient id="ld-line" x1="0" x2="1"><stop offset="0" stopColor="#7fc0ff" /><stop offset="1" stopColor="#3b9eff" /></linearGradient>
          <linearGradient id="ld-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3b9eff" stopOpacity=".28" /><stop offset="1" stopColor="#3b9eff" stopOpacity="0" /></linearGradient>
        </defs>
        {[56, 96, 136, 176].map((y) => <line key={y} x1="24" x2="376" y1={y} y2={y} className="stroke-edge" />)}
        <g key={id}>
          <path d={area} fill="url(#ld-fill)" className="anim-up" style={{ animationDelay: ".9s" }} />
          <path d={line} pathLength={1} fill="none" stroke="url(#ld-line)" strokeWidth="3" strokeLinecap="round" className="draw-path" />
          <line x1={end[0]} x2={end[0]} y1="20" y2="196" stroke="#3b9eff" strokeDasharray="4 4" className="flow-line" />
          <circle cx={end[0]} cy={end[1]} r="5" fill="#34d399" className="ping" />
          <circle cx={end[0]} cy={end[1]} r="5" fill="#34d399" className="stroke-ink" strokeWidth="2" />
        </g>
        <text x={end[0] - 8} y="32" textAnchor="end" fontSize="10" className="fill-mute">Graduates to DAMM v2</text>
        <text x="200" y="228" textAnchor="middle" fontSize="10" className="fill-mute">Tokens sold along the curve</text>
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-panel2/70 p-3"><div className="text-mute">Starts at</div><div className="mt-1 font-bold text-white">{start} SOL</div></div>
        <div className="rounded-lg bg-panel2/70 p-3"><div className="text-mute">Graduates at</div><div className="mt-1 font-bold text-white">{grad} SOL</div></div>
        <div className="rounded-lg bg-panel2/70 p-3"><div className="text-mute">Market cap grows</div><div className="mt-1 font-bold text-violet">{ratio.toFixed(ratio % 1 ? 1 : 0)}x</div></div>
      </div>
      <p className="mt-2 text-[10px] text-mute">Starting and graduation market caps are the real preset values (in SOL). The curve shape is an illustration. Real curves are previewed on the Create page.</p>
    </div>
  );
}
