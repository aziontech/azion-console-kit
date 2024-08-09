export const themeSelect = ({ HTMLElement, theme }) => {
  let selectedTheme = theme
  if (!theme || theme === 'system') {
    selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const currentApplicationTheme = selectedTheme === 'light' ? 'dark' : 'light'

  HTMLElement.classList.replace(`azion-${currentApplicationTheme}`, `azion-${selectedTheme}`)
}
