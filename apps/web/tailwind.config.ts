import type { Config } from "tailwindcss";

// SpendGuard UI theme: light purple, per project brief.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
