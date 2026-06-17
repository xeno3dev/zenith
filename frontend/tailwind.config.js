/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        accent: '#FF6B6B',
        background: '#0F0F1A',
        surface: '#1A1A2E',
        text: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
