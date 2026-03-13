import { useThemeStore } from '@/stores/theme'
import { themeApply } from '@/helpers'

let themeApplied = false

export function themeGuard() {
  if (themeApplied) return

  const themeStore = useThemeStore()
  const theme = localStorage.getItem('theme')
  const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const currentTheme = theme || fallbackTheme

  themeStore.setTheme(currentTheme)
  themeApply(currentTheme)
  themeApplied = true
}
