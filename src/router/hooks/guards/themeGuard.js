export async function themeGuard(accountStore) {
  // TODO: remove the usage of localStorage when API returns the theme
  const theme = localStorage.getItem('theme')
  const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  accountStore.setTheme(theme || fallbackTheme)
}
