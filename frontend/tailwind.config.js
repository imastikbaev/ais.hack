/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary purple scale — центр #58058C (600)
        primary: {
          50:  "#fdf5ff",
          100: "#f5e3ff",
          200: "#e8c2ff",
          300: "#d491ff",
          400: "#b558e8",
          500: "#8b1fc8",
          600: "#58058C",
          700: "#430069",
          800: "#2d0047",
          900: "#1a002a",
        },
        // Sidebar — тёмно-пурпурный вместо navy
        navy: {
          700: "#1c0030",
          800: "#11001d",
          900: "#08000f",
        },
        // Акцент — тёплый золотой (хорошо контрастирует с фиолетовым)
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger:  { 500: "#ef4444", 600: "#dc2626" },
        warning: { 400: "#fb923c", 500: "#f97316" },
        success: { 500: "#22c55e", 600: "#16a34a" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
