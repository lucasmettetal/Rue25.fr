/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      // Contrastes vérifiés sur le fond papier (#f1f2f3), seuil WCAG AA 4.5:1
      // pour le texte et 3:1 pour les contours d'éléments interactifs.
      colors: {
        cream:  '#f1f2f3',   // papier de patronage
        stone:  '#dfe1e4',   // séparateurs décoratifs uniquement (1.2:1)
        line:   '#888c92',   // contours cliquables : champs, boutons  (3.0:1)
        muted:  '#6b6f75',   // texte secondaire                       (4.5:1)
        // Bleu de craie de tailleur. La version claire est faite pour les
        // fonds sombres (4.5:1 sur dark) et ne tient pas sur fond clair ;
        // `accent-ink` prend le relais dès qu'il y a du clair derrière.
        accent: '#2e8dad',                                        // (4.5:1 sur dark)
        'accent-ink': '#1f6076',                                  // (6.3:1 sur cream)
        dark:   '#191c1f',
      },
      borderRadius: { none: '0' },
    },
  },
  plugins: [],
};
