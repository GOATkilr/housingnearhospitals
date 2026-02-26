import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0F2137",
          blue: "#3F78B4",
          slate: "#4A5568",
          light: "#F8F9FA",
        },
        score: {
          excellent: "#059669",
          good: "#10B981",
          fair: "#F59E0B",
          poor: "#F97316",
          bad: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        brand: "12px",
      },
      spacing: {
        section: "80px",
      },
    },
  },
  plugins: [],
};

export default config;
