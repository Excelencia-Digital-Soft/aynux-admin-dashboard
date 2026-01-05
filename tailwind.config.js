/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/primevue/**/*.{vue,js,ts,jsx,tsx}'
  ],
  darkMode: ['class', '.dark-mode'],
  theme: {
    extend: {
      colors: {
        // Primary (Violet) - matches PrimeVue primary
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        },
        // Navy (Brand Dark) - for sidebar, headers
        navy: {
          50: '#e8eef6',
          100: '#c5d4e8',
          200: '#9fb8d8',
          300: '#789cc8',
          400: '#5a87bc',
          500: '#3d72b0',
          600: '#2d5a8c',
          700: '#1e3a5f',
          800: '#142b4a',
          900: '#0c1d3d',
          950: '#061222'
        },
        // Cyan (Accent) - for highlights, CTAs
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344'
        }
      },
      backgroundImage: {
        // Aynux gradient (navy -> violet -> cyan)
        'aynux-gradient': 'linear-gradient(135deg, #0c1d3d 0%, #7c3aed 50%, #06b6d4 100%)',
        'aynux-gradient-vertical': 'linear-gradient(180deg, #0c1d3d 0%, #7c3aed 50%, #06b6d4 100%)',
        'aynux-gradient-subtle': 'linear-gradient(135deg, #1e3a5f 0%, #6d28d9 100%)',
        'aynux-gradient-light': 'linear-gradient(135deg, #ede9fe 0%, #ecfeff 100%)'
      }
    }
  },
  plugins: []
}
