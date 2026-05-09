/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tutr: {
          dark: '#1a1a2e',
          darker: '#0f0f1a',
          accent: '#6c5ce7',
          'accent-light': '#a29bfe',
          surface: '#232341',
          'surface-light': '#2d2d50',
          success: '#00b894',
          danger: '#e17055',
          warning: '#fdcb6e',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'speaking': 'speaking 0.3s ease-in-out infinite alternate',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        speaking: {
          '0%': { transform: 'scaleY(1)' },
          '100%': { transform: 'scaleY(1.3)' },
        },
      },
    },
  },
  plugins: [],
}
