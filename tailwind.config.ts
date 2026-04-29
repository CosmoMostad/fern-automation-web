import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#ffffff",
        rule: "#e5e5e5",
        muted: "#666666",
        // 9-step fern green ramp
        fern: {
          900: "#1C3D2A",
          800: "#2D5A3D",
          700: "#3D7A55",
          600: "#52936B",
          500: "#7BB896",
          400: "#A8C49A",
          300: "#D4E4D8",
          200: "#EDF4EF",
          100: "#F6FAF7",
          DEFAULT: "#2D5A3D",
        },
        gold: "#C89B3C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        prose: "42rem",
        page: "64rem",
      },
    },
  },
  plugins: [],
};

export default config;
