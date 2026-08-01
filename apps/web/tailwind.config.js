import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#F472B6",
          navy: "#1E293B",
          amber: "#F59E0B",
          gold: "#D97706",
        },
        glass: {
          surface: "rgba(255, 255, 255, 0.75)",
          border: "rgba(226, 232, 240, 0.8)",
          darkSurface: "rgba(15, 23, 42, 0.85)",
        },
      },
      backdropBlur: {
        xs: "2px",
        glass: "12px",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
