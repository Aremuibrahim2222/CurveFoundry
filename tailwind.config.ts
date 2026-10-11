import type { Config } from "tailwindcss";

// Colors come from CSS variables (see app/globals.css) so light and dark mode share one set of class names.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: v("ink"), panel: v("panel"), panel2: v("panel2"), edge: v("edge"), mute: v("mute"),
        violet: v("accent"), sky: v("accent"), up: v("up"), down: v("down"),
        white: v("fg"),
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
