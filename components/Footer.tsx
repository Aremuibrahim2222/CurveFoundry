import Link from "next/link";

export default function Footer() {
  return (
    <footer className="card mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-xs text-mute">
      <span className="text-white">CurveFoundry</span>
      <Link className="hover:text-white" href="/explore">Markets</Link>
      <Link className="hover:text-white" href="/design">Create token</Link>
      <Link className="hover:text-white" href="/presets">Presets</Link>
      <Link className="hover:text-white" href="/about">About</Link>
      <span className="ml-auto">Built on Meteora. Not financial advice.</span>
    </footer>
  );
}
