/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: 'rgb(var(--color-bg) / <alpha-value>)',
        'dark-light': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
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
