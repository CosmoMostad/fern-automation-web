import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        paper: "#ffffff",
        rule: "#e5e5e5",
        muted: "#666666",
        fern: "#2D5A3D",
        "fern-soft": "#3D7A55",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
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
