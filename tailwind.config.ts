import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          50: "#f6f8fc",
          100: "#e9edf5",
          200: "#c9d1e3",
          950: "#0a0e14",
          900: "#0f1420",
          850: "#131926",
          800: "#171e2c",
          750: "#1c2434",
          700: "#212a3d",
          600: "#394563",
          500: "#6b7796",
          400: "#8a95b3",
          300: "#a7b1cb",
        },
        accent: {
          DEFAULT: "#3b9dff",
          50: "#e9f4ff",
          100: "#cfe7ff",
          200: "#9fceff",
          300: "#6fb5ff",
          400: "#4ca3ff",
          500: "#3b9dff",
          600: "#1c7ce0",
          700: "#155fb0",
          800: "#0f4680",
          900: "#0a2f57",
        },
        success: {
          DEFAULT: "#3ecf8e",
          bg: "rgba(62, 207, 142, 0.12)",
        },
        warning: {
          DEFAULT: "#f2b84b",
          bg: "rgba(242, 184, 75, 0.12)",
        },
        danger: {
          DEFAULT: "#f2555a",
          bg: "rgba(242, 85, 90, 0.12)",
        },
        neutral: {
          DEFAULT: "#8593b5",
          bg: "rgba(133, 147, 181, 0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
      animation: {
        "pulse-slow": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.18s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateY(-4px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
