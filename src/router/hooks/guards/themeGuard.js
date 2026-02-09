import { useThemeStore } from '@/stores/theme'
import { themeApply } from '@/helpers'

export async function themeGuard() {
  const themeStore = useThemeStore()
  const theme = localStorage.getItem('theme')
  const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const currentTheme = theme || fallbackTheme

  themeStore.setTheme(currentTheme)

  themeApply({
    HTMLElement: document.querySelector(':root'),
    theme: currentTheme
  })
}
