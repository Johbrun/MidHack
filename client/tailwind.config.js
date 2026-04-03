/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#0E0B11',
        'dark-light': '#161222',
        accent: '#FABB5C',
        cyan: '#0593A7',
        terracotta: '#A1540D',
      },
      fontFamily: {
        heading: ['Exo', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
    },
  },
  plugins: [],
};
