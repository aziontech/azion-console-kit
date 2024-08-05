import { defineStore } from 'pinia'

const STATUS_CLIENT_REVIEW_PAYMENT_REQUIRED = ['BLOCKED', 'DEFAULTING']

export const useAccountStore = defineStore({
  id: 'account',
  persist: {
    paths: ['identifySignUpProvider']
  },
  state: () => ({
    account: {},
    identifySignUpProvider: ''
  }),
  getters: {
    accountData(state) {
      return state.account
    },
    hasActiveUserId(state) {
      return !!state.account?.id
    },
    hasNotStatusRegular(state) {
      return state.account?.status !== 'REGULAR'
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
      return state.identifySignUpProvider
    },
    userId(state) {
      return state.account?.user_id
    },
    isReviewPaymentRequired(state) {
      return STATUS_CLIENT_REVIEW_PAYMENT_REQUIRED.includes(state.account?.status)
    }
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
      this.identifySignUpProvider = method
    },
    resetSsoSignUpMethod() {
      this.identifySignUpProvider = ''
    }
  }
})
