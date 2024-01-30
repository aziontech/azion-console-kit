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
    },
    isFirstLogin(state) {
      return state.account?.first_login
    },
    accountUtcOffset(state) {
      return state.account?.utc_offset || '+0000'
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
