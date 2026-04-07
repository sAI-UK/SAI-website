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
        ink: "#1F2937",
        mist: "#F5F1E8",
        sand: "#E7DCC8",
        forest: "#1F4B43",
        teal: "#2E6F66",
        sky: "#DCECF1",
        coral: "#D98F70",
        gold: "#D6A556",
      },
      boxShadow: {
        card: "0 24px 60px rgba(21, 45, 42, 0.12)",
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 20% 20%, rgba(214,165,86,0.18), transparent 25%), radial-gradient(circle at 80% 0%, rgba(46,111,102,0.16), transparent 30%), radial-gradient(circle at 50% 80%, rgba(217,143,112,0.14), transparent 24%)",
      },
      maxWidth: {
        proseWide: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
