/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef8f6',
          100: '#d5efe9',
          200: '#abe0d4',
          300: '#79c9b8',
          400: '#4aad97',
          500: '#31917c',
          600: '#257465',
          700: '#215e53',
          800: '#1e4c44',
          900: '#1b403a',
          950: '#0d2522',
        },
        steel: {
          50: '#f4f6f8',
          100: '#e4e9ee',
          200: '#cbd5de',
          300: '#a7b7c7',
          400: '#7c93a9',
          500: '#61778f',
          600: '#4e6076',
          700: '#404e60',
          800: '#384351',
          900: '#323a46',
          950: '#21262e',
        },
        status: {
          valid: '#16a34a',
          ready: '#16a34a',
          recovering: '#d97706',
          medium: '#d97706',
          invalid: '#dc2626',
          expired: '#dc2626',
          high: '#dc2626',
          indeterminate: '#6b7280',
        },
      },
      boxShadow: {
        panel: '0 1px 3px rgba(33,38,46,0.08), 0 8px 24px rgba(33,38,46,0.06)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.35s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
