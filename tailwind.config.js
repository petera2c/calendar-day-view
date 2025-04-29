/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: "#3498db",
        secondary: "#2ecc71",
        accent: "#9b59b6",
        danger: "#e74c3c",
        warning: "#f39c12",
        background: "#f7f9fc",
      },
      gridTemplateColumns: {
        calendar: "repeat(7, minmax(0, 1fr))",
      },
      gridTemplateRows: {
        calendar: "auto repeat(24, minmax(3rem, 1fr))",
      },
    },
  },
  plugins: [],
};
