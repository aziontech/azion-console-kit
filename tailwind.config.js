import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
      square: 'square',
      roman: 'upper-roman'
    },
    extend: {
      colors: {
        header: '#171717',
        'header-button-enabled': '#ffffff32',
        'header-button-hover': '#f5f5f516',
        'header-avatar': '#363636',
        'orange-base': '#F3652B'
      },
      backgroundColor: {
        'orange-bullet': '#F3652B'
      },
      borderColor: {
        header: '#3e3e3e',
        'header-hover': '#F3652B',
        'radio-card-active': '#F3652B'
      },
      textColor: {
        header: '#b5b5b5',
        'success-check': '#22C55E'
      },
      transitionProperty: {
        width: 'width'
      },
      width: {
        slide: '384px'
      },
      height: {
        // subtract 60px for footer and 56px for header
        'visible-area': 'calc(100vh - 60px - 56px)',
        'graph-card': '552px'
      },
      fontFamily: {
        robotomono: ['Roboto Mono']
      },
      animation: {
        fadeIn: 'fadeIn 220ms ease-in-out',
        fadeOut: 'fadeOut 220ms ease-in-out',
        slideDown: 'slideDown 220ms ease-in-out',
        locationPulse: 'locationPulse 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideDown: {
          '0%': { height: '0' },
          '100%': { height: 'auto' }
        },
        locationPulse: {
          '0%': {
            transform: 'scale(0.95)',
            'box-shadow': '0 0 rgba(150, 150, 150, 0.7)'
          },
          '70%': {
            transform: 'scale(1)',
            'box-shadow': '0 0 0 8px rgba(150, 150, 150, 0)'
          },
          '100%': {
            transform: 'scale(0.95)',
            'box-shadow': '0 0 rgba(150, 150, 150, 0)'
          }
        }
      }
    }
  },
  plugins: [typography]
}
