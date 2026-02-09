export const themeApply = ({ HTMLElement, theme }) => {
  let selectedTheme = theme

  if (!HTMLElement) {
    HTMLElement = document.querySelector(':root')
  }

  if (!selectedTheme || selectedTheme === 'system') {
    selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const currentApplicationTheme = selectedTheme === 'light' ? 'dark' : 'light'
  HTMLElement.classList.replace(`azion-${currentApplicationTheme}`, `azion-${selectedTheme}`)
}
