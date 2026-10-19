/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        google: ['"Google Sans"', '"Product Sans"', "Roboto", "Arial", "sans-serif"],
        roboto: ["Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
