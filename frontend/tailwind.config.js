/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Finer control on small phones + very large monitors
      screens: {
        xs: '475px',
        '3xl': '1600px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brandGold: {
          50: '#FBF8EF',
          100: '#F5EED8',
          200: '#EBDCB1',
          300: '#DFC685',
          400: '#D4B05C',
          500: '#C6923B', // Exact Logo Gold
          600: '#B07B28',
          700: '#8E601C',
          800: '#724B17',
          900: '#5C3B12',
          950: '#382207',
        },
        brandObsidian: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#334155',
          700: '#1E293B',
          800: '#111827', // Exact Logo Charcoal
          900: '#0F172A',
          950: '#0B0F17', // Exact Logo Deep Obsidian
        },
        brandNavy: {
          950: '#0B0F17',
          900: '#0F172A',
          800: '#111827',
          700: '#1E293B',
          600: '#334155',
        },
        brandBlue: {
          50: '#FBF8EF',
          100: '#F5EED8',
          200: '#EBDCB1',
          300: '#DFC685',
          400: '#D4B05C',
          500: '#C6923B',
          600: '#B07B28',
          700: '#8E601C',
          800: '#724B17',
          900: '#5C3B12',
        },
        accent: {
          400: '#D4B05C',
          500: '#C6923B',
          600: '#B07B28',
          700: '#8E601C',
        },
        lightBg: '#FAFBFC',
        surface: '#FFFFFF',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 0 1px rgba(198, 146, 59, 0.2), 0 10px 34px -8px rgba(198, 146, 59, 0.35)',
        'glow-lg': '0 0 46px -8px rgba(198, 146, 59, 0.45)',
        'glow-gold': '0 0 30px -4px rgba(198, 146, 59, 0.5)',
        'glass': '0 8px 32px -8px rgba(11, 15, 23, 0.4)',
        'inner-top': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #111827 0%, #1E293B 50%, #C6923B 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, #111827 0%, #C6923B 100%)',
        'gradient-gold': 'linear-gradient(135deg, #E5B04E 0%, #C6923B 50%, #8E601C 100%)',
        'hero-radial': 'radial-gradient(60% 60% at 50% 0%, rgba(198,146,59,.18) 0%, rgba(198,146,59,0) 70%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slideDown 0.25s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'gradient': 'gradient 6s ease infinite',
        'aurora': 'aurora 22s ease-in-out infinite',
        'spin-slow': 'spinSlow 16s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-16px) translateX(6px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        aurora: {
          '0%': { transform: 'translate(-12%, -8%) rotate(0deg)' },
          '50%': { transform: 'translate(10%, 10%) rotate(180deg)' },
          '100%': { transform: 'translate(-12%, -8%) rotate(360deg)' },
        },
        spinSlow: {
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
