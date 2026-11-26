/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#060913',
        panel: '#0D1322',
        edge: '#1E293B',
        cyan: '#06B6D4',
        critical: '#F43F5E',
        elevated: '#F59E0B',
        healthy: '#10B981',
        purple: '#A855F7',
      },
      backgroundImage: {
        'grid': "linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
