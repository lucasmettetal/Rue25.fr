/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      // Contrastes vérifiés sur le fond crème (#f8f6f3), seuil WCAG AA 4.5:1
      // pour le texte et 3:1 pour les contours d'éléments interactifs.
      colors: {
        cream:  '#f8f6f3',
        stone:  '#e5e0d8',   // séparateurs décoratifs uniquement (1.2:1)
        line:   '#9e8b6d',   // contours cliquables : champs, boutons  (3.1:1)
        muted:  '#767065',   // texte secondaire                       (4.6:1)
        accent: '#b5894a',   // doré de marque : aplats et fonds sombres (5.6:1 sur dark)
        // Même doré, assombri pour rester lisible sur fond clair : le précédent
        // plafonnait à 2.9:1, sous le seuil, et servait justement aux surtitres
        // en 10 px.
        'accent-ink': '#8d6b3a',                                    // (4.5:1)
        dark:   '#1a1815',
      },
      borderRadius: { none: '0' },
    },
  },
  plugins: [],
};
