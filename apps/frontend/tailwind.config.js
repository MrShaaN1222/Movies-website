/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brandBg: "#08090f",
        brandCard: "#121522",
        brandAccent: "#e50914",
        mxGold: "#d4a417",
        mxGoldDark: "#9a7210",
        ottBlue: "#1f6feb",
      },
    },
  },
  plugins: [],
};
