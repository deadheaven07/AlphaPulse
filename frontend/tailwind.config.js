/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
      'ultrawide': '3440px',
    },
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#F8FAFC",
          dark: "#0C101A", // Soothing warm midnight charcoal
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#141A29", // Gentle elevated slate card
          elevated: "#1D2436",
        },
        border: {
          DEFAULT: "#E2E8F0",
          dark: "#232D42", // Soft matte border (zero eye glare)
        },
        muted: {
          DEFAULT: "#64748B",
          dark: "#8E9EB5", // Calming soft silver-slate
        },
        subtle: {
          DEFAULT: "#94A3B8",
          dark: "#627188",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        profit: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        risk: {
          50: "#FFF1F2",
          100: "#FFE4E6",
          200: "#FECDD3",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE123C",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'card-dark': '0 8px 24px -4px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'hover': '0 12px 28px -5px rgba(99, 102, 241, 0.12), 0 4px 10px -3px rgba(99, 102, 241, 0.06)',
        'hover-dark': '0 12px 28px -5px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(129, 140, 248, 0.3)',
        'profit': '0 8px 20px -3px rgba(16, 185, 129, 0.18)',
        'risk': '0 8px 20px -3px rgba(244, 63, 94, 0.18)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'spin-slow': 'spin 16s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.7, transform: 'scale(1)' },
          '50%': { opacity: 0.9, transform: 'scale(1.01)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
