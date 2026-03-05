/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#E4590F',
          light: '#F17A3A',
          dark: '#C94A0D',
        },
        secondary: {
          DEFAULT: '#D9D9D9',
          light: '#F0F0F0',
          dark: '#B8B8B8',
        },
      },
    },
  },
  plugins: [],
} 