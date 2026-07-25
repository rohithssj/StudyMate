/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: '#09090B',
        surface: '#18181B',
        surfaceAlt: '#27272A',
        card: '#18181B',
        border: '#27272A',
        accent: '#F97316',
        accentDim: 'rgba(249,115,22,0.15)',
        textPrimary: '#FFFFFF',
        textSecondary: '#A1A1AA',
        textMuted: '#71717A',
        success: '#22C55E',
        warn: '#EAB308',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
}
