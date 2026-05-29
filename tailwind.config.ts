import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#f4f1e9",
          text: "#2c2417",
          green: "#6b8f3f",
          teal: "#3f7d6b",
          brown: "#5a4632",
          orange: "#b5882a",
          red: "#a8451f",
          border: "#e6e0d4",
          muted: "#9a8d70",
          "text-muted": "#776b52",
          "text-muted2": "#8a7d5f",
          card: "#faf8f1",
          "card-alt": "#f0ebde",
        },
      },
      fontFamily: {
        sans: ["Public Sans", "sans-serif"],
        serif: ["Fraunces", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
