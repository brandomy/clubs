/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rotary: {
          // Primary Colors (Official Rotary International)
          blue: '#0067c8',      // Rotary Azure (PMS 2175C) - Primary brand color
          gold: '#f7a81b',      // Rotary Gold (PMS 130C) - Accent color

          // Secondary Blues (Official)
          royal: '#17458f',     // Rotary Royal Blue (PMS 286C)
          azure: '#0067c8',     // Azure (same as blue, for backwards compatibility)
          sky: '#00a2e0',       // Sky Blue (PMS 2202C - Interact)
          darkblue: '#004a8a',  // Legacy dark blue (deprecated)

          // Secondary Accent Colors (Official)
          cranberry: '#d41367', // Cranberry (PMS 214C - Rotaract)
          turquoise: '#00adbb', // Turquoise (PMS 7466C)
          violet: '#901f93',    // Violet (PMS 2070C)
          orange: '#ff7600',    // Orange (PMS 2018C)

          // Additional Official Colors
          cardinal: '#e02927',  // Cardinal (PMS 485C - End Polio Now)
          grass: '#009739',     // Grass Green (PMS 355C)

          // Standard Colors
          white: '#ffffff',
          black: '#000000',
        }
      },
      fontFamily: {
        'sans': ['Open Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}
