import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#06111F",
        ink: "#0B1727",
        panel: "#0E2138",
        cyanSoft: "#67E8F9",
        delBlue: "#1D4ED8",
        trust: "#14B8A6",
        danger: "#EF4444",
        warning: "#F59E0B"
      },
      boxShadow: {
        glow: "0 0 40px rgba(103, 232, 249, 0.16)",
        card: "0 18px 60px rgba(0, 0, 0, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
