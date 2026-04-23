import typography from '@tailwindcss/typography'
import { theme } from '@aziontech/theme/tailwind/tailwind-theme'
import semanticColors from '@aziontech/theme/tailwind/semantic-colors-plugin'
import semanticTexts from '@aziontech/theme/tailwind/semantic-texts-plugin'
import semanticSpacing from '@aziontech/theme/tailwind/semantic-spacing-plugin'

/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    '../src/**/*.{vue,js,ts,jsx,tsx}',
    '../node_modules/@aziontech/webkit/**/*.{vue,js,ts,jsx,tsx}'
  ],
  // Dark mode configuration
  // Use `.dark` on an ancestor (Storybook uses `withThemeByClassName` to toggle it)
  darkMode: ['class'],
  // Merge base theme with primitives
  theme: {
    ...theme,
    fontFamily: {
      ...(theme.fontFamily ?? {}),
      sans: ['Sora'],
      mono: ['Proto Mono'],
      code: ['Roboto Mono']
    },
    listStyleType: {
      ...(theme.listStyleType ?? {}),
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
      square: 'square',
      roman: 'upper-roman'
    },
    // Properly merge the theme's extend with local extend
    extend: {
      // Import colors from theme (brand, base, surface, primitives)
      ...(theme.extend ?? {}),
      // Storybook-specific color extensions
      colors: {
        ...(theme.extend?.colors ?? {}),
        header: '#111111',
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
        roboto: ['Roboto'],
        robotomono: ['Roboto Mono'],
        sora: ['Sora'],
        protomono: ['Proto Mono'],
        mono: ['Proto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', 'monospace']
      },
      animation: {
        fadeIn: 'fadeIn 220ms ease-in-out',
        fadeOut: 'fadeOut 220ms ease-in-out',
        slideDown: 'slideDown 220ms ease-in-out',
        blink: 'blink 1.4s infinite both',
        'highlight-fade': 'highlight ease-in forwards'
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'var(--surface-hover)', fontWeight: '500' },
          '100%': { backgroundColor: 'var(--surface-hover)', fontWeight: '500' }
        },
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
        blink: {
          '0%, 100% ': { opacity: '0.2' },
          '20%': { opacity: '1' }
        }
      }
    }
  },
  plugins: [
    typography,
    semanticColors(),
    semanticTexts(),
    semanticSpacing(),
  ]
}
