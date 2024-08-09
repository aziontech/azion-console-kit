export const themeSelect = ({ theme }) => {
  let selectedTheme = theme
  if (!theme || theme === 'system') {
    selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const currentApplicationTheme = selectedTheme === 'light' ? 'dark' : 'light'

  const root = document.querySelector(':root')
  root.classList.replace(`azion-${currentApplicationTheme}`, `azion-${selectedTheme}`)
}
