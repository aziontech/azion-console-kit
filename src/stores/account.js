import { defineStore } from 'pinia'

export const useAccountStore = defineStore({
  id: 'account',
  state: () => ({
    account: {}
  }),
  getters: {
    accountData(state) {
      return state.account
    },
    hasActiveUserId(state) {
      return !!state.account?.id
    },
    currentTheme(state) {
      return state.account?.colorTheme
    }
  },
  actions: {
    setAccountData(account) {
      this.account = { ...this.account, ...account }
    },
    setTheme(theme) {
      this.account.colorTheme = theme

      // TODO: remove the usage of localStorage when API returns the theme
      localStorage.setItem('theme', theme)
    }
  }
})
