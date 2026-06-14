/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        cream:  '#f8f6f3',
        stone:  '#e5e0d8',
        muted:  '#7a7368',
        accent: '#b5894a',
        dark:   '#1a1815',
      },
      borderRadius: { none: '0' },
    },
  },
  plugins: [],
};
