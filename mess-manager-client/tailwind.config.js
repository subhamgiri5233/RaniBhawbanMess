/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated Neutral Scale
        zinc: {
          950: '#09090b',
        },
        slate: {
          950: '#020617',
        },
        // Professional Primary (Modern Indigo)
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#ced9fd',
          300: '#a3b8fc',
          400: '#728efa',
          500: '#4f46e5', // Core Brand
          600: '#4338ca',
          700: '#3730a3',
          800: '#312e81',
          900: '#23215e',
          950: '#1e1b4b',
        },
        // Success/Finance (Deep Emerald)
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Warning/Premium (Amber/Gold)
        accent: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.05)',
        'premium-dark': '0 10px 40px -10px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
