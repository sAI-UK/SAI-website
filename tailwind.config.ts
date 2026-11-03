import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Each colour comes from a CSS variable (see the top of app/globals.css).
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        mist: "rgb(var(--c-mist) / <alpha-value>)",
        sand: "rgb(var(--c-sand) / <alpha-value>)",
        forest: "rgb(var(--c-forest) / <alpha-value>)",
        teal: "rgb(var(--c-teal) / <alpha-value>)",
        sky: "rgb(var(--c-sky) / <alpha-value>)",
        coral: "rgb(var(--c-coral) / <alpha-value>)",
        gold: "rgb(var(--c-gold) / <alpha-value>)",
        paper: "rgb(var(--c-paper) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      boxShadow: {
        card: "none",
      },
      backgroundImage: {
        grain: "none",
      },
      maxWidth: {
        proseWide: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
