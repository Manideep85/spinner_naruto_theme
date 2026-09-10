import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        konoha: {
          orange: "#FF6B00",
          orangeLight: "#FF8800",
          darkOrange: "#CC5500",
          red: "#E60000",
          crimson: "#990000",
          cyan: "#00F0FF",
          blue: "#0077FF",
          gold: "#FFD700",
          darkBg: "#0B0D14",
          cardBg: "#141724",
          border: "#2A3048",
          scrollBg: "#FBEFD5",
          scrollText: "#3A2818",
          scrollBorder: "#B88A44",
        },
      },
      fontFamily: {
        ninja: ["system-ui", "sans-serif"],
      },
      keyframes: {
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseChakra: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.3)" },
          "50%": { boxShadow: "0 0 35px rgba(0, 240, 255, 0.8), inset 0 0 25px rgba(0, 240, 255, 0.6)" },
        },
        pulseFlame: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 107, 0, 0.5), 0 0 40px rgba(230, 0, 0, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255, 107, 0, 0.9), 0 0 70px rgba(230, 0, 0, 0.6)" },
        },
        scrollUnroll: {
          "0%": { transform: "scaleY(0.05)", opacity: "0" },
          "100%": { transform: "scaleY(1)", opacity: "1" },
        },
      },
      animation: {
        "spin-slow": "spinSlow 12s linear infinite",
        "spin-fast": "spinSlow 1.5s linear infinite",
        "pulse-chakra": "pulseChakra 2s infinite ease-in-out",
        "pulse-flame": "pulseFlame 2s infinite ease-in-out",
        "scroll-unroll": "scrollUnroll 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
