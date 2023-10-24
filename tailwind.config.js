/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      header: '#171717',
      'header-hover': '#ffffff32'
    },
    borderColor: {
      header: '#3e3e3e'
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
