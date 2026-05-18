/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          dark: '#0D0518',
          purple: '#1A0A2E',
          blue: '#0D1B4B',
          pink: '#E86EAD',
          teal: '#4ECDC4',
          gold: '#C9A84C'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
