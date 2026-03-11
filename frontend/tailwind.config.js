/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        watchly: {
          bg: "var(--watchly-bg)",
          secondary: "var(--watchly-secondary)",
          accent: "var(--watchly-accent)",
          "text-primary": "var(--watchly-text-primary)",
          "text-secondary": "var(--watchly-text-secondary)"
        }
      },
      boxShadow: {
        glow: "0 10px 30px rgba(0, 168, 255, 0.25)"
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      }
    }
  },
  plugins: []
};
