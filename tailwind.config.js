/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'montenegro-green': '#0B6E4F',
        'montenegro-red': '#FF0000',
        'montenegro-yellow': '#FFD54F',
        brand: {
          black: '#1a1a1a',
          green: '#00C853',
          red: '#E53935',
          cream: '#FFF8E1',
          gold: '#FFD54F',
          gray: {
            light: '#F5F5F5',
            muted: '#424242',
          },
        },
      },
      backgroundColor: {
        primary: '#0B6E4F',
        secondary: '#FFD54F',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      /* Escala armónica: 12, 14, 16, 18, 20, 24, 30, 36 */
      fontSize: {
        'display-xs': ['1.25rem', { lineHeight: '1.4' }],
        'display-sm': ['1.5rem', { lineHeight: '1.3' }],
        'display-md': ['1.875rem', { lineHeight: '1.25' }],
        'display-lg': ['2.25rem', { lineHeight: '1.2' }],
        'display-xl': ['3rem', { lineHeight: '1.15' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
      },
      animation: {
        'fade-in-scale': 'fadeInScale 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      transitionDuration: {
        200: '200ms',
        250: '250ms',
        300: '300ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      /* Mobile-first breakpoints (Tailwind default) */
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      /* Touch-friendly: mínimo 44px para áreas clicables */
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
