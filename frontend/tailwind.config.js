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
        // Primary: IBM Blue
        brand: {
          50:  '#edf5ff',
          100: '#d0e2ff',
          200: '#a6c8ff',
          300: '#78a9ff',
          400: '#4589ff',
          500: '#0f62fe',   // IBM Blue — primary
          600: '#0043ce',
          700: '#002d9c',
          800: '#001d6c',
          900: '#001141',
          950: '#00072a',
        },
        // Secondary: Emerald Green (from mockup)
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#16a34a',   // Emerald Green — secondary
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Accent: warm amber for highlights
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        // Surface neutrals — clean light backgrounds
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-md': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'card-lg': '0 8px 24px 0 rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.08)',
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.06)',
        'elevated': '0 4px 12px 0 rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-in-out',
        'slide-up':   'slideUp 0.35s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
