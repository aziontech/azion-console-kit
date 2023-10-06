export const themeSelect = ({ theme }) => {
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const prevTheme = theme === 'light' ? 'dark' : 'light'

  const root = document.querySelector(':root')
  root.classList.replace(`azion-${prevTheme}`, `azion-${theme}`)
}
