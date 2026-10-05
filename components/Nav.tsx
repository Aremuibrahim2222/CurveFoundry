"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DEMO_MODE, NETWORK } from "@/lib/solana/env";
const WalletMultiButton = dynamic(() => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton), { ssr: false });

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-bold">Curve<span className="bg-gradient-to-r from-violet to-sky bg-clip-text text-transparent">Foundry</span></Link>
        <nav className="flex gap-5 text-sm text-mute">
          <Link href="/explore" className="hover:text-white">Explore</Link>
          <Link href="/design" className="hover:text-white">Launch</Link>
          <Link href="/presets" className="hover:text-white">Presets</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {DEMO_MODE && <span className="rounded border border-amber-400/50 px-2 py-0.5 text-xs text-amber-300">DEMO MODE</span>}
          <span className="hidden text-xs text-mute sm:inline">{NETWORK}</span>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
