/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B2B26',
        teal: '#145C4B',
        marigold: '#EAB308', /* Updated to a more mustard yellow based on design */
        chili: '#DC2626', /* Updated red for better contrast */
        paper: '#FBF4E7',
        sage: '#A3E4D7', /* Minty green for active tabs */
        offwhite: '#F6F0E4',
        primary: '#1E9D5A', /* Vibrant green for landing page CTAs */
        'soft-green': '#E8F5E9', /* Light green for landing page backgrounds */
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
