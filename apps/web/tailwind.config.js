import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Core brand ramp — warm rose, tuned for a beauty/salon product.
        brand: {
          50: "#fff1f5",
          100: "#ffe0eb",
          200: "#ffc2d9",
          300: "#ff94ba",
          400: "#fb6f9c",
          500: "#f0367e", // primary
          600: "#d31e66",
          700: "#ad1454",
          800: "#831049",
          900: "#4a0a2b",
          pink: "#F472B6",
          navy: "#1E293B",
          amber: "#F59E0B",
          gold: "#D97706",
        },
        plum: {
          50: "#f8f3f7",
          100: "#efe1ec",
          400: "#7c4a72",
          500: "#5b2f52",
          600: "#43223d",
          700: "#2f1729",
          800: "#1f0f1b",
          900: "#150a12",
        },
        cream: {
          50: "#fffaf5",
          100: "#fdf2e9",
          200: "#f9e4d2",
        },
        glass: {
          surface: "rgba(255, 255, 255, 0.72)",
          border: "rgba(255, 255, 255, 0.5)",
          darkSurface: "rgba(31, 15, 27, 0.75)",
          darkBorder: "rgba(255, 255, 255, 0.08)",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #f0367e 0%, #d31e66 45%, #ad1454 100%)",
        "gradient-gold": "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
        "gradient-hero": "radial-gradient(120% 120% at 10% 10%, #831049 0%, #43223d 45%, #150a12 100%)",
        "gradient-sunrise": "linear-gradient(120deg, #ff94ba 0%, #fbbf24 100%)",
      },
      boxShadow: {
        glow: "0 8px 30px -8px rgba(240, 54, 126, 0.45)",
        "glow-gold": "0 8px 30px -8px rgba(217, 119, 6, 0.4)",
        panel: "0 4px 24px -6px rgba(31, 15, 27, 0.12)",
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
      },
      borderRadius: {
        lg: "0.9rem",
        md: "0.6rem",
        sm: "0.4rem",
        xl: "1.25rem",
        "2xl": "1.75rem",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
