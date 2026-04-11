/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'toastmasters': {
          'blue': '#004165',
          'maroon': '#772432',
          'gray': '#A9B2B1',
        }
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'source': ['Source Sans 3', 'sans-serif'],
      },
      spacing: {
        '11': '2.75rem',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}