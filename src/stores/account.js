import { defineStore } from 'pinia'

export const useAccountStore = defineStore({
  id: 'account',
  persist: {
    paths: ['identifySignUpProvider']
  },
  state: () => ({
    account: {},
    identifySignUpProvider: '',
    accountStatuses: {
      BLOCKED: 'BLOCKED',
      DEFAULTING: 'DEFAULTING',
      TRIAL: 'TRIAL',
      ONLINE: 'ONLINE',
      REGULAR: 'REGULAR'
    },
    flags: {
      RESTRICT_ACCESS_TO_METRICS_ONLY: 'allow_only_metrics_on_console',
      FULL_CONSOLE_ACCESS: 'allow_console',
      SSO_MANAGEMENT: 'federated_auth',
      MARKETPLACE_PRODUCTS: 'marketplace_products'
    }
  }),
  getters: {
    accountData(state) {
      return state.account
    },
    hasActiveUserId(state) {
      return !!state.account?.id
    },
    hasPermissionToEditDataStream(state) {
      const permissionToEditDataStream = 'Edit Data Stream'
      return !!state.account.permissions?.some(
        (permission) => permission.name === permissionToEditDataStream
      )
    },
    metricsOnlyAccessRestriction(state) {
      const flags = state.flags
      const client_flags = state.account?.client_flags || []
      return (
        client_flags.includes(flags.RESTRICT_ACCESS_TO_METRICS_ONLY) &&
        !client_flags.includes(flags.FULL_CONSOLE_ACCESS)
      )
    },
    hasAccessToSSOManagement(state) {
      return state.account?.client_flags?.includes(state.flags.SSO_MANAGEMENT)
    },
    hasAccessConsole(state) {
      const { client_flags = [], isDeveloperSupportPlan } = state.account
      return client_flags.includes(state.flags.FULL_CONSOLE_ACCESS) || !!isDeveloperSupportPlan
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
    accountStatus(state) {
      return state.account?.status
    },
    redirectToExternalBillingNeeded(state) {
      return !state.account?.status || state.accountStatuses.REGULAR === state.account?.status
    },
    billingAccessPermitted(state) {
      return [
        state.accountStatuses.BLOCKED,
        state.accountStatuses.DEFAULTING,
        state.accountStatuses.TRIAL,
        state.accountStatuses.ONLINE
      ].includes(state.account?.status)
    },
    paymentReviewPending(state) {
      return [state.accountStatuses.BLOCKED, state.accountStatuses.DEFAULTING].includes(
        state.account?.status
      )
    },
    hasAccessToMarketplaceProducts(state) {
      const { flags, account } = state
      return account?.client_flags?.includes(flags.MARKETPLACE_PRODUCTS)
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
