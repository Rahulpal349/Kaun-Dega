/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.2s ease-out forwards',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      colors: {
        // App Theme matching Flutter app (theme.dart)
        primary: {
          DEFAULT: '#145C4B',
          dark: '#0E382F',
          light: '#1E826B',
          accent: '#25D366',
        },
        brand: {
          bg: '#F4FBF7',
          surface: '#FFFFFF',
          muted: '#F0F7F4',
          border: '#E2EFE9',
        },
        text: {
          main: '#111827',
          sub: '#4B5563',
          muted: '#9CA3AF',
        },
        status: {
          positive: '#0D9488',
          positiveBg: '#E6F4ED',
          negative: '#E11D48',
          negativeBg: '#FFE4E6',
        },
        ink: '#0B2B26',
        teal: '#145C4B',
        paper: '#FBF4E7',
        sage: '#A3E4D7',
        offwhite: '#F6F0E4',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Inter', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'sans-serif'],
        body: ['var(--font-plus-jakarta)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
};

