/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.tsx',
    './*.ts',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,css}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1132d4',
          500: '#1132d4',
          600: '#0d27a8',
          700: '#0a1f85',
          dark: '#0d27a8',
        },
        'background-light': '#f6f6f8',
        'background-dark': '#101322',
        'surface-dark': '#1c1d27',
        'surface-light': '#ffffff',
        'surface-highlight': '#282b39',
        'border-dark': '#282b39',
        'border-light': '#e5e7eb',
        'text-secondary': '#9da1b9',
        'text-muted': '#9da1b9',
        'text-primary': '#111418',
        'input-dark': '#1c1d27',
        'input-light': '#ffffff',
      },
      fontFamily: {
        display: ['Manrope', 'Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.5s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2.4s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.25s ease-out',
        in: 'fadeIn 0.15s ease-out',
        'slide-in-from-top-2': 'slideUp 0.2s ease-out',
      },
    },
  },
  plugins: [forms, containerQueries],
};
