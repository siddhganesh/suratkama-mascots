/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    { pattern: /bg-brown\/(5|10|15|20|25|30|40|50|60|70|80|90)/ },
    { pattern: /border-brown\/(5|10|15|20|25|30|40|50|60|70|80|90)/ },
    { pattern: /bg-amber\/(5|10|15|20|25|30|40|50|60|70|80|90)/ },
  ],
  theme: {
    extend: {
      colors: {
        // ── Brown palette ─────────────────────────────────────────────
        brown: {
          50:  '#fdf8f3',
          100: '#f9eed9',
          200: '#f0d4a8',
          300: '#e3b87a',
          400: '#d49a52',
          500: '#c07d35',   // primary brown
          600: '#a4621e',
          700: '#884b14',
          800: '#6b3810',
          900: '#4a2710',
          950: '#2d1608',
        },
        // ── Warm accent ───────────────────────────────────────────────
        caramel: 'rgb(192 125 53 / <alpha-value>)',
        mocha:   'rgb(104 56 16 / <alpha-value>)',
        cream:   '#FFF8F0',
        ivory:   '#FFFDF9',
        sand:    '#F5ECD7',
        // ── Neutral ───────────────────────────────────────────────────
        warm: {
          50:  '#FAFAF8',
          100: '#F5F5F0',
          200: '#EAEAE0',
          300: '#D4D4C8',
          400: '#A8A898',
          500: '#7A7A6C',
          600: '#5A5A4E',
          700: '#3E3E34',
          800: '#252520',
          900: '#151510',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
        serif:   ['Georgia', 'serif'],
      },
      animation: {
        'float':          'float 6s ease-in-out infinite',
        'pulse-warm':     'pulseWarm 2.5s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'fade-up':        'fadeUp 0.5s ease forwards',
        'spin-slow':      'spin 10s linear infinite',
        'bounce-subtle':  'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        pulseWarm: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(192,125,53,0.3)' },
          '50%':      { boxShadow: '0 0 50px rgba(192,125,53,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-warm':  'linear-gradient(135deg, #f9eed9 0%, #FFF8F0 50%, #f9eed9 100%)',
        'gradient-brown': 'linear-gradient(135deg, #c07d35, #884b14)',
        'mesh-warm':      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c07d35' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'warm-sm': '0 2px 12px rgba(192,125,53,0.12)',
        'warm-md': '0 8px 30px rgba(192,125,53,0.18)',
        'warm-lg': '0 20px 60px rgba(192,125,53,0.22)',
        'warm-xl': '0 30px 90px rgba(192,125,53,0.28)',
        'card':    '0 4px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}
