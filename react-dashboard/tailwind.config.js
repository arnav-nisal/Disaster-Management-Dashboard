/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          // Base surfaces — lifted navy charcoal (not pitch black)
          950: '#0a1524',
          900: '#111d2e',
          850: '#172036',
          800: '#1e2d45',
          700: '#2a3f5c',
          // Accents
          accent:   '#4b9eda',   // professional steel blue
          sage:     '#5a8f78',   // calm sage green (authority tone)
          alert:    '#d95f5f',   // muted Indian red
          warning:  '#c9963d',   // warm amber-gold (saffron nod)
          amber:    '#c9963d',
          success:  '#4caf80',   // calm emerald
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
