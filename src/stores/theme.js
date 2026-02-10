import { defineStore } from 'pinia'

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

export const getSystemTheme = () => {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light'
}

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem('theme')
  return storedTheme || getSystemTheme()
}

export const useThemeStore = defineStore({
  id: 'theme',
  state: () => ({
    theme: getInitialTheme()
  }),
  getters: {
    currentTheme: (state) => state.theme
  },
  actions: {
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
    }
  }
})
