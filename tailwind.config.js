/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A3258',
        secondary: '#F0F2F5',
        accent: '#FFD700',
      },
      // The dropShadow object goes HERE, inside extend:
      dropShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.7)',
        'glow-gold': '0 0 15px rgba(245, 158, 11, 0.7)',
      },
    },
  },
  plugins: [],
}