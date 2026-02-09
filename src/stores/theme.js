import { defineStore } from 'pinia'

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme) return storedTheme

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore({
  id: 'theme',
  state: () => ({
    theme: getInitialTheme()
  }),
  getters: {
    currentTheme(state) {
      return state.theme
    }
  },
  actions: {
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
    }
  }
})
