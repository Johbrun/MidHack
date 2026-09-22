/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette BananaShop
        accent: {
          DEFAULT: '#FABB5C',
          50: '#FFF8EC',
          100: '#FEEDD0',
          600: '#F0A73A',
        },
        cyan: {
          DEFAULT: '#0593A7',
          50: '#E7F5F7',
          700: '#047384',
        },
        terracotta: {
          DEFAULT: '#A1540D',
          50: '#FAF0E6',
        },
        ink: '#1C1527',
        muted: '#6E6777',
        cream: '#F5F3F0',
        sand: '#EBE8E4',
        line: '#E6E1D9',
        // Surfaces sombres réservées aux overlays de l'atelier (onboarding,
        // bandeaux) : ils restent volontairement hors de la charte boutique.
        dark: '#0E0B11',
        'dark-light': '#161222',
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'Figtree', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['"Source Code Pro"', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,21,39,0.04), 0 4px 16px rgba(28,21,39,0.06)',
        lift: '0 2px 4px rgba(28,21,39,0.05), 0 12px 32px rgba(28,21,39,0.10)',
      },
    },
  },
  plugins: [],
};
