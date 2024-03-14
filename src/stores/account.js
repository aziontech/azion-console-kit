import { defineStore } from 'pinia'

export const useAccountStore = defineStore({
  id: 'account',
  persist: {
    paths: ['_ssoSignUpMethod']
  },
  state: () => ({
    account: {},
    _ssoSignUpMethod: ''
  }),
  getters: {
    accountData(state) {
      return state.account
    },
    hasActiveUserId(state) {
      return !!state.account?.id
    },
    shouldAvoidCalculateServicePlan(state) {
      return !!state.account?.isDeveloperSupportPlan
    },
    currentTheme(state) {
      return state.account?.colorTheme
    },
    isFirstLogin(state) {
      return state.account?.first_login
    },
    accountUtcOffset(state) {
      return state.account?.utc_offset || '+0000'
    },
    ssoSignUpMethod(state) {
      return state._ssoSignUpMethod
    },
  },
  actions: {
    setAccountData(account) {
      this.account = { ...this.account, ...account }
    },
    resetAccount() {
      this.account = {}
    },
    setTheme(theme) {
      this.account.colorTheme = theme

      // TODO: remove the usage of localStorage when API returns the theme
      localStorage.setItem('theme', theme)
    },
    setSsoSignUpMethod(method) {
      this._ssoSignUpMethod = method
    },
    resetSsoSignUpMethod() {
      this._ssoSignUpMethod = ''
    },
  }
})
