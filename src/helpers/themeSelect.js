export const themeSelect = ({ pvInstance, theme }) => {
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const oldTheme = theme === 'light' ? 'dark' : 'light'
  pvInstance.changeTheme(`theme-${oldTheme}`, `theme-${theme}`, 'theme-link', () => {})
}
