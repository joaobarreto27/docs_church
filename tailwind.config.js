/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        church: {
          gold: '#C59B4B',
          'gold-light': '#D4AF37',
          'gold-dark': '#A37B30',
          parchment: '#FAF8F5',
          sand: '#EAE5DF',
          charcoal: '#1C1917',
          muted: '#6B655F',
          dark: '#111319',
          'dark-card': '#1C202B',
          'dark-border': '#282E3E',
        },
        alert: {
          bg: '#FEF3C7',
          text: '#78350F',
          border: '#F59E0B',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        title: ['"Montserrat"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-gold': '0 10px 30px -10px rgba(197, 155, 75, 0.25)',
        'sheet': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
