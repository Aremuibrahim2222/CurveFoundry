import "./globals.css";
import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import Header from "@/components/Header";

const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CurveFoundry — Design the market. Then launch the asset.",
  description: "Design custom launch mechanics, simulate price discovery, and launch assets through Meteora's Dynamic Bonding Curve.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono antialiased`}>
        <Providers>
          <div className="mx-auto max-w-6xl px-3 py-3">
            <Header />
            <main className="py-4">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
