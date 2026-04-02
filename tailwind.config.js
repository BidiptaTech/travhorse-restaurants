/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        p1: "#0759c6",
        p2: "#0759c6",
        b50: "#F5F5F7",
        n0: "#1A1A1C",
        n50: "#151718",
        n75: "#2A2A2E",
        n100: "#3A3A40",
        n400: "#4A4A4A",
        n500: "#6B6B70",
        n6: "#242428",
        g50: "#6B7280",
        g60: "#9CA3AF",
      },
    },
  },
  plugins: [],
};
