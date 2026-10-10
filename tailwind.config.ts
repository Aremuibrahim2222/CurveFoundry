import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090c12", panel: "#0f141c", panel2: "#151b25", edge: "#1c2431", mute: "#6b7686",
        violet: { DEFAULT: "#3b9eff" }, sky: { DEFAULT: "#4aa3ff" },
        up: "#2fd08a", down: "#ff5c6c",
      },
      fontFamily: {
        sans: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
