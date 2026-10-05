import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07070c", panel: "#0e0e17", edge: "#1e1e2e", mute: "#8a8aa3",
        violet: { DEFAULT: "#8b5cf6" }, sky: { DEFAULT: "#38bdf8" },
        up: "#34d399", down: "#f87171",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
