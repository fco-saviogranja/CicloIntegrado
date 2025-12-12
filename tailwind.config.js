module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ff5a2e",
        "primary-dark": "#e84d23",
        "primary-light": "#ff7a4d",
        "brand-orange": "#ff5a2e",
        "brand-orange-medium": "#fe8222",
        "brand-orange-light": "#fd931d",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "card-light": "#ffffff",
        "card-dark": "#1e293b",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
        "text-primary": "#1e293b",
        "text-secondary": "#64748b",
      },
      fontFamily: {
        display: ["Readex Pro", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
