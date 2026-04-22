/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00D9FF',
          green: '#00FF88',
          purple: '#7B68EE'
        },
        dark: {
          bg: '#0A0E17',
          card: '#111827',
          elevated: '#1A2332'
        }
      },
      fontFamily: {
        sans: ['"Roboto Condensed"', 'sans-serif']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-glow': 'linear-gradient(135deg, rgba(0,217,255,0.15) 0%, rgba(123,104,238,0.1) 100%)'
      }
    }
  },
  plugins: []
}
