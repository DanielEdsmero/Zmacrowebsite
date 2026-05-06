import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          term: "#39ff14",
          dim: "#1fa30a",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-33.333%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-33.333%)" },
          "100%": { transform: "translateX(0)" },
        },
        glitch: {
          "0%":   { transform: "translate(0)",        filter: "none" },
          "20%":  { transform: "translate(-3px, 1px)", filter: "brightness(1.5) hue-rotate(40deg)" },
          "40%":  { transform: "translate(3px, -2px)", filter: "saturate(0) brightness(1.3)" },
          "60%":  { transform: "translate(-2px, 2px)", filter: "hue-rotate(-40deg)" },
          "80%":  { transform: "translate(2px, -1px)", filter: "brightness(0.8)" },
          "100%": { transform: "translate(0)",        filter: "none" },
        },
      },
      animation: {
        marquee: "marquee 18s linear infinite",
        "marquee-reverse": "marquee-reverse 18s linear infinite",
        glitch: "glitch 0.2s steps(2) 1",
      },
    },
  },
  plugins: [],
};

export default config;
