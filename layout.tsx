import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "CurveFoundry — Design the market. Then launch the asset.",
  description: "Design custom launch mechanics, simulate price discovery, and launch assets through Meteora's Dynamic Bonding Curve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
