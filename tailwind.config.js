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
      },
      animation: {
        'pop-in': 'pop-in 0.2s ease-out forwards',
      },
      colors: {
        ink: '#0B2B26',
        teal: '#145C4B',
        marigold: '#EAB308',
        chili: '#DC2626',
        paper: '#FBF4E7',
        sage: '#A3E4D7',
        offwhite: '#F6F0E4',
        primary: '#145C4B',
        'soft-green': '#E8F5E9',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
