import { getSystemTheme } from '@/stores/theme'

export const themeApply = (theme) => {
  const rootElement = document.querySelector(':root')
  if (!rootElement) return

  const selectedTheme = !theme || theme === 'system' ? getSystemTheme() : theme
  const oppositeTheme = selectedTheme === 'light' ? 'dark' : 'light'

  // Ensure base 'azion' class is always present
  if (!rootElement.classList.contains('azion')) {
    rootElement.classList.add('azion')
  }

  // Replace theme-specific class (azion-dark <-> azion-light)
  rootElement.classList.remove(`azion-${oppositeTheme}`)
  rootElement.classList.add(`azion-${selectedTheme}`)
}
