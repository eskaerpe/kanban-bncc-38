/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bncc: {
          blue: '#005691',
          'blue-dark': '#004070',
          cyan: '#00A8E8',
          navy: '#1B365D',
          slate: '#0F172A',
          border: '#E2E8F0',
          bg: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
}
