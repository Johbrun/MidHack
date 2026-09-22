/** @type {import('tailwindcss').Config} */
// Comme pour le Hacking QG, seul le reset (preflight) de Tailwind sert : le
// scoreboard est stylé par les tokens et composants de src/index.css.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'Source Code Pro', 'monospace'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
