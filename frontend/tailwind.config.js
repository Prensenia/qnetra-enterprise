/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#090D16',
        panel: '#111827',
        edge: '#1E293B',
        cyan: '#06B6D4',
        critical: '#EF4444',
        elevated: '#F59E0B',
        healthy: '#10B981',
      },
    },
  },
  plugins: [],
}
