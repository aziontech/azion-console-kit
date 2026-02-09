export const themeApply = (theme) => {
  let selectedTheme = theme
  const rootElement = document.querySelector(':root')

  if (!rootElement) return

  if (!selectedTheme || selectedTheme === 'system') {
    selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const currentApplicationTheme = selectedTheme === 'light' ? 'dark' : 'light'
  rootElement.classList.replace(`azion-${currentApplicationTheme}`, `azion-${selectedTheme}`)
}
