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
          dark: "#080C14",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#0F172A",
          elevated: "#1E293B",
        },
        border: {
          DEFAULT: "#E2E8F0",
          dark: "#1E293B",
          glow: "rgba(99, 102, 241, 0.2)",
        },
        muted: {
          DEFAULT: "#64748B",
          dark: "#94A3B8",
        },
        subtle: {
          DEFAULT: "#94A3B8",
          dark: "#64748B",
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
        neon: {
          blue: "#00E5FF",
          green: "#00FF87",
          amber: "#FFB800",
          rose: "#FF2A85",
          purple: "#9D00FF",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'card-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'hover': '0 15px 35px -5px rgba(99, 102, 241, 0.15), 0 5px 15px -3px rgba(99, 102, 241, 0.08)',
        'hover-dark': '0 20px 40px -10px rgba(99, 102, 241, 0.3), 0 0 1px 1px rgba(99, 102, 241, 0.4)',
        'profit': '0 10px 25px -3px rgba(16, 185, 129, 0.25)',
        'risk': '0 10px 25px -3px rgba(244, 63, 94, 0.25)',
        'glow-cyan': '0 0 25px rgba(0, 229, 255, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px rgba(244, 63, 94, 0.35)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.35)',
        '3d-lift': '0 20px 30px -10px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
