"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DEMO_MODE, NETWORK } from "@/lib/solana/utils";

const WalletButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="" className="h-7 w-auto" />
          <span className="font-semibold tracking-tight">Curve<span className="grad-text">Foundry</span></span>
        </Link>
        <nav className="flex gap-5 text-sm text-mute">
          <Link className="hover:text-white" href="/explore">Explore</Link>
          <Link className="hover:text-white" href="/design">Launch</Link>
          <Link className="hover:text-white" href="/presets">Presets</Link>
          <Link className="hover:text-white" href="/dashboard">Dashboard</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded border border-edge px-2 py-0.5 text-xs text-mute">{NETWORK}</span>
          {DEMO_MODE && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">DEMO MODE</span>}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
