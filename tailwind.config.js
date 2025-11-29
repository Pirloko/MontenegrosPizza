/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'montenegro-green': '#0B6E4F',
        'montenegro-red': '#FF0000',
        'montenegro-yellow': '#FFD54F',
      },
      backgroundColor: {
        'primary': '#0B6E4F',
        'secondary': '#FFD54F',
      }
    },
  },
  plugins: [],
};
