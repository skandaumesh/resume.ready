import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ink & olive ramp — matches the sage/lime/ink brand system.
        // 600 is the primary action color (ink), 500 the olive focus/accent,
        // 50–200 the pale lime tints used for chips and highlights.
        brand: {
          50: "#f7f8ec",
          100: "#edf0d6",
          200: "#dde3b8",
          300: "#c6d18d",
          400: "#a3af62",
          500: "#737c42",
          600: "#1b1710",
          700: "#0e0c08",
          800: "#070604",
        },
      },
    },
  },
  plugins: [],
};

export default config;
