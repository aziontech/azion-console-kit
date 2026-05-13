const SORA_FONT_URL = 'https://fonts.azion.com/sora/Sora-VariableFont_wght.ttf'

export const checkoutFonts = [
  {
    family: 'Sora',
    src: `url('${SORA_FONT_URL}') format('truetype-variations')`,
    weight: '400',
    style: 'normal'
  },
  {
    family: 'Sora',
    src: `url('${SORA_FONT_URL}') format('truetype-variations')`,
    weight: '500',
    style: 'normal'
  },
  {
    family: 'Sora',
    src: `url('${SORA_FONT_URL}') format('truetype-variations')`,
    weight: '600',
    style: 'normal'
  }
]

export const buildCheckoutAppearance = (themeStore) => {
  const isDarkTheme = themeStore.currentTheme === 'dark'
  const rootStyles =
    typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement) : null

  // Read live CSS custom properties so the Stripe iframe matches what the
  // host page resolves for `text-base`, `text-color`, etc. Falls back to a
  // sane hex if the var isn't defined (avoids invalid CSS reaching Stripe).
  const readVar = (name, fallback) => rootStyles?.getPropertyValue(name)?.trim() || fallback

  const surfaceBackground = readVar(
    '--background-surface',
    readVar('--surface-100', isDarkTheme ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)')
  )
  const textColor = readVar('--text-color', isDarkTheme ? '#ededed' : '#1c1c1c')
  const placeholderColor = readVar('--text-color-secondary', isDarkTheme ? '#666666' : '#979797')
  const inputBackground = isDarkTheme ? '#282828' : '#f4f4f4'
  const inputBorderColor = readVar('--surface-border', isDarkTheme ? '#353535' : '#dddddd')

  return {
    theme: isDarkTheme ? 'night' : 'stripe',
    variables: {
      colorPrimary: '#f3652b',
      colorText: textColor,
      colorTextPlaceholder: placeholderColor,
      colorBackground: surfaceBackground,
      colorDanger: '#ef4444',
      spacingUnit: '4px',
      borderRadius: '6px',
      fontFamily: "'Sora', sans-serif",
      // Stripe renders inside an iframe with its own root context, so we
      // use px (matches tailwind `text-base` = 1rem = 16px on the host).
      fontSizeBase: '16px',
      fontWeightNormal: '400',
      fontLineHeight: '1.5'
    },
    rules: {
      '.Label': {
        // Matches the rendered size of `LabelBlock` in the host page (12px
        // after the project's tailwind/theme overrides, not the raw
        // `text-base` value declared in the source).
        fontSize: '12px',
        fontWeight: '500',
        lineHeight: '20px',
        marginBottom: '0.5rem',
        color: textColor,
        fontFamily: "'Sora', sans-serif"
      },
      '.Input': {
        // Matches the system InputText (`$inputTextFontSize: 0.875rem` from
        // @aziontech/theme — 14px). Placeholder uses the same size below so
        // both are visually consistent.
        backgroundColor: inputBackground,
        border: `1px solid ${inputBorderColor}`,
        boxShadow: 'none',
        padding: '0.487rem 0.5rem',
        fontSize: '14px',
        lineHeight: '1.5',
        color: textColor,
        fontFamily: "'Sora', sans-serif"
      },
      '.Input::placeholder': {
        color: placeholderColor,
        fontFamily: "'Sora', sans-serif",
        fontSize: '14px',
        lineHeight: '1.5'
      },
      '.Input:hover': {
        borderColor: '#f3652b'
      },
      '.Input:focus': {
        border: '1px solid #f3652b',
        boxShadow: '0 0 0 0.2rem rgba(243, 100, 43, 0.62)'
      },
      '.Tab': {
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.875rem'
      },
      '.TabLabel': {
        fontFamily: "'Sora', sans-serif",
        fontWeight: '500'
      },
      '.Error': {
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.75rem'
      },
      '.RedirectText': {
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.875rem'
      },
      '.AccordionItem': {
        fontFamily: "'Sora', sans-serif"
      },
      '.PickerItem': {
        fontFamily: "'Sora', sans-serif"
      },
      '.Block': {
        fontFamily: "'Sora', sans-serif"
      }
    }
  }
}
