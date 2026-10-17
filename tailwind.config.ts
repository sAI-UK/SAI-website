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
        // Each colour comes from a CSS variable so the site themes can repaint it (see app/globals.css).
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
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        mono: ['"Courier Prime"', '"Courier New"', "monospace"],
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
