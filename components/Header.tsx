"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import { DEMO_MODE, NETWORK } from "@/lib/solana/utils";

const WalletButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

// The logo already goes home, so every menu item opens a different page.
const LINKS = [["/explore", "Markets"], ["/design", "Create token"], ["/presets", "Presets"], ["/dashboard", "Dashboard"], ["/about", "About"]] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu whenever the page changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // While the menu is open: lock page scroll and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <header className="sticky top-3 z-30">
      <div className="card glass glass-strong flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="" className="h-7 w-auto" />
          <span className="font-bold tracking-tight text-white">Curve<span className="grad-text">Foundry</span></span>
        </Link>
        <nav className="hidden gap-4 text-xs text-violet md:flex">
          {LINKS.map(([href, label]) => <Link key={href} className={`hover:text-white ${pathname === href ? "text-white" : ""}`} href={href}>{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-lg border border-edge px-2 py-1 text-[11px] text-mute lg:inline">{NETWORK}</span>
          {DEMO_MODE && <span className="rounded-lg bg-amber-500/20 px-2 py-1 text-[11px] text-amber-300">DEMO MODE</span>}
          <div className="hidden sm:block"><ThemeToggle /></div>
          <WalletButton />
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-panel2 text-violet md:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>

      {open && (
        // Full-screen and fully opaque: only the menu is visible, never the page behind it.
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-ink p-4 md:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mark.png" alt="" className="h-7 w-auto" />
              <span className="font-bold tracking-tight text-white">Curve<span className="grad-text">Foundry</span></span>
            </Link>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-panel2 text-violet">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <nav className="mt-4 flex flex-1 flex-col divide-y divide-edge overflow-y-auto">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={`py-5 text-xl ${pathname === href ? "text-white" : "text-violet"}`}>{label}</Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center justify-between border-t border-edge pt-4 text-xs text-mute">
            <span>Theme</span><ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
