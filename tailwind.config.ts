import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f4f7fb",
        muted: "#9aa7b5",
        surface: "#080d13",
        panel: "#101820",
        line: "#263241",
        evergreen: "#22c55e",
        mineral: "#38bdf8",
        ember: "#f87171",
        gold: "#fbbf24"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
