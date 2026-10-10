"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DEMO_MODE, NETWORK } from "@/lib/solana/utils";

const WalletButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

export default function Header() {
  return (
    <header className="card flex h-16 items-center gap-5 px-4">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark.png" alt="" className="h-7 w-auto" />
        <span className="font-bold tracking-tight text-white">Curve<span className="grad-text">Foundry</span></span>
      </Link>
      <nav className="hidden gap-5 text-xs text-violet sm:flex">
        <Link className="hover:text-white" href="/">Home</Link>
        <Link className="hover:text-white" href="/design">Create token</Link>
        <Link className="hover:text-white" href="/presets">Presets</Link>
        <Link className="hover:text-white" href="/dashboard">Profile</Link>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden rounded-lg border border-edge px-2 py-1 text-[11px] text-mute sm:inline">{NETWORK}</span>
        {DEMO_MODE && <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-[11px] text-amber-300">DEMO MODE</span>}
        <WalletButton />
      </div>
    </header>
  );
}
