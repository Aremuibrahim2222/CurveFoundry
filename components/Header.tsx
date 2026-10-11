"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import { DEMO_MODE, NETWORK } from "@/lib/solana/utils";

const WalletButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

// The logo already goes home, so every menu item opens a different page.
const LINKS = [["/explore", "Markets"], ["/design", "Create token"], ["/presets", "Presets"], ["/dashboard", "Dashboard"], ["/about", "About"]] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-3 z-30">
      <div className="card glass glass-strong flex h-16 items-center gap-4 px-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="" className="h-7 w-auto" />
          <span className="font-bold tracking-tight text-white">Curve<span className="grad-text">Foundry</span></span>
        </Link>
        <nav className="hidden gap-4 text-xs text-violet md:flex">
          {LINKS.map(([href, label]) => <Link key={href} className="hover:text-white" href={href}>{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-lg border border-edge px-2 py-1 text-[11px] text-mute lg:inline">{NETWORK}</span>
          {DEMO_MODE && <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-[11px] text-amber-300">DEMO MODE</span>}
          <div className="hidden sm:block"><ThemeToggle /></div>
          <WalletButton />
          <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-panel2 text-violet md:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
        </div>
      </div>
      {open && (
        // Solid background on purpose: the menu must stay readable over page content.
        <nav className="card mt-2 flex flex-col bg-panel p-2 text-sm shadow-2xl md:hidden">
          {LINKS.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-violet hover:bg-panel2">{label}</Link>)}
          <div className="flex items-center justify-between px-3 py-2 text-xs text-mute sm:hidden"><span>Theme</span><ThemeToggle /></div>
        </nav>
      )}
    </header>
  );
}
