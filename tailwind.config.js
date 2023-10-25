/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      header: '#171717',
      'header-input': '#292929',
      'header-button-enabled': '#ffffff32',
      'header-button-hover': 'rgba(244, 244, 244, 0.04)',
      'header-avatar': '#363636'
    },
    borderColor: {
      header: '#3e3e3e'
    },
    textColor: {
      header: '#b5b5b5'
    },
    extend: {
      transitionProperty: {
        width: 'width'
      },
      width: {
        slide: '300px'
      }
    }
  },
  plugins: []
}
