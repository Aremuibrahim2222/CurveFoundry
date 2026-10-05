"use client";
import { useMemo, useState } from "react";
import type { CurvePoint } from "@/lib/curve/preview";
import { formatCompact } from "@/lib/solana/utils";

interface Props { points: CurvePoint[]; quoteLabel: string; markerSold?: number; height?: number }

export default function CurveChart({ points, quoteLabel, markerSold, height = 280 }: Props) {
  const [mode, setMode] = useState<"price" | "marketCap">("price");
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = height, P = { l: 56, r: 12, t: 12, b: 28 };
  const { path, xs, ys, maxX, maxY } = useMemo(() => {
    const maxX = Math.max(...points.map((p) => p.tokensSold), 1e-9);
    const maxY = Math.max(...points.map((p) => p[mode]), 1e-12);
    const xs = (v: number) => P.l + (v / maxX) * (W - P.l - P.r);
    const ys = (v: number) => H - P.b - (v / maxY) * (H - P.t - P.b);
    const path = points.map((p, i) => `${i ? "L" : "M"}${xs(p.tokensSold).toFixed(1)},${ys(p[mode]).toFixed(1)}`).join(" ");
    return { path, xs, ys, maxX, maxY };
  }, [points, mode, H]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!points.length) return <div className="card p-6 text-sm text-mute">Curve preview unavailable for this configuration.</div>;
  const last = points[points.length - 1];
  const hp = hover != null ? points[hover] : null;
  const marker = markerSold != null ? points.reduce((a, b) => (Math.abs(b.tokensSold - markerSold) < Math.abs(a.tokensSold - markerSold) ? b : a)) : null;

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex gap-1">
          {(["price", "marketCap"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded px-2 py-1 ${mode === m ? "bg-edge text-white" : "text-mute"}`}>
              {m === "price" ? "Price" : "Market cap"}
            </button>
          ))}
        </div>
        <span className="text-mute">{hp ? `Sold ${formatCompact(hp.tokensSold)} · ${formatCompact(hp[mode])} ${quoteLabel} · raised ${formatCompact(hp.raised)}` : "Hover the curve"}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const v = ((x - P.l) / (W - P.l - P.r)) * maxX;
          let best = 0; points.forEach((p, i) => { if (Math.abs(p.tokensSold - v) < Math.abs(points[best].tokensSold - v)) best = i; });
          setHover(best);
        }}>
        <defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#38bdf8" /></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={ys(maxY * t)} y2={ys(maxY * t)} stroke="#1e1e2e" />
            <text x={P.l - 6} y={ys(maxY * t) + 4} textAnchor="end" fontSize="10" fill="#8a8aa3">{formatCompact(maxY * t)}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="url(#cg)" strokeWidth="2.5" />
        <line x1={xs(last.tokensSold)} x2={xs(last.tokensSold)} y1={P.t} y2={H - P.b} stroke="#8b5cf6" strokeDasharray="4 4" />
        <text x={xs(last.tokensSold) - 6} y={P.t + 10} textAnchor="end" fontSize="10" fill="#a78bfa">Graduation → DAMM v2</text>
        {marker && <circle cx={xs(marker.tokensSold)} cy={ys(marker[mode])} r="5" fill="#34d399" stroke="#07070c" strokeWidth="2" />}
        {hp && <circle cx={xs(hp.tokensSold)} cy={ys(hp[mode])} r="4" fill="#fff" />}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#8a8aa3">Tokens sold along the curve</text>
      </svg>
      <p className="mt-1 text-[11px] text-mute">Preview computed from the Meteora config produced by the SDK. Prices in {quoteLabel} per token.</p>
    </div>
  );
}
