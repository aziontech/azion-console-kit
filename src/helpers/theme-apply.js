import { getSystemTheme } from '@/stores/theme'

export const themeApply = (theme) => {
  const rootElement = document.querySelector(':root')
  if (!rootElement) return

  const selectedTheme = !theme || theme === 'system' ? getSystemTheme() : theme
  const oppositeTheme = selectedTheme === 'light' ? 'dark' : 'light'

  rootElement.classList.replace(`azion-${oppositeTheme}`, `azion-${selectedTheme}`)
}
