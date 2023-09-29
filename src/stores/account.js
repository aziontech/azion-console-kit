import { defineStore } from 'pinia'

export const useAccountStore = defineStore({
  id: 'account',
  state: () => ({
    account: null
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
      this.account = account
    },
    setTheme(theme) {
      this.account.colorTheme = theme
      localStorage.setItem('theme', theme)
    }
  }
})
