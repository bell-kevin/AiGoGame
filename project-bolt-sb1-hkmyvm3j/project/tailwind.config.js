/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        board: {
          light: '#E6C470',
          dark: '#D5AA4C',
          border: '#966F33'
        },
        stone: {
          black: '#111111',
          white: '#F9F9F9'
        },
        accent: {
          primary: '#8C6F3F',
          secondary: '#D8BF8A',
          highlight: '#F7CD57',
          danger: '#BF4342'
        }
      },
      boxShadow: {
        'stone': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'stone-highlight': '0 0 0 3px rgba(247, 205, 87, 0.6)'
      },
      animation: {
        'stone-place': 'stonePlaced 0.3s ease-out',
        'pulse-once': 'pulse 1s ease-in-out 1'
      },
      keyframes: {
        stonePlaced: {
          '0%': { transform: 'scale(0.6)', opacity: '0.6' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
    },
  },
  plugins: [],
};