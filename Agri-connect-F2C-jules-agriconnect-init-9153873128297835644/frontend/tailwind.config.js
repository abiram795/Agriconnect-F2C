/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0B6B3A",
        secondary: "#2E8B57",
        accent: "#F4B400",
        background: "#F8FAF7",
        card: "#FFFFFF",
        text: "#1F2937"
      }
    },
  },
  plugins: [],
}
