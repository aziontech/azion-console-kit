export const themeSelect = ({ pvInstance, theme }) => {
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const prevTheme = theme === 'light' ? 'dark' : 'light'
  pvInstance.changeTheme(`theme-${prevTheme}`, `theme-${theme}`, 'theme-link', () => {})
}
