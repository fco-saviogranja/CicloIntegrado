module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        "primary-dark": "#0d5ec0",
        "primary-light": "#3b82f6",
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
        display: ["Public Sans", "sans-serif"],
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
