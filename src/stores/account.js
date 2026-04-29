import { defineStore } from 'pinia'

export const useAccountStore = defineStore({
  id: 'account',
  persist: {
    paths: ['identifySignUpProvider', 'hasSession']
  },
  state: () => ({
    account: {},
    hasSession: false,
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
      DATA_STREAM_SAMPLING: 'data_streaming_sampling',
      MARKETPLACE_PRODUCTS: 'marketplace_products',
      HIDE_CREATE_OPTIONS: 'hide_create_options',
      FORCE_REDIRECT_TO_CONSOLE: 'force_redirect_to_console',
      ENABLE_WAF_TUNING: 'enable_waf_tuning_details_save'
    }
  }),
  getters: {
    accountData(state) {
      return state.account
    },
    clientFlags(state) {
      return state.account?.client_flags
    },
    hasEnableWafTuning(state) {
      return state.account?.client_flags?.includes(state.flags.ENABLE_WAF_TUNING)
    },
    hasActiveUserId(state) {
      return !!state.account?.id
    },
    hasPermissionToEditDataStream(state) {
      const permissionToEditDataStream = 'Edit Data Stream'
      const hasPermissionToEdit = !!state.account.permissions?.some(
        (permission) => permission.name === permissionToEditDataStream
      )
      return hasPermissionToEdit || state.account.is_account_owner
    },
    hasPermissionToViewDataStream(state) {
      return !!state.account.permissions?.find(
        (permission) => permission.name === 'View Data Stream'
      )
    },
    hasSamplingFlag(state) {
      return state.account?.client_flags?.includes(state.flags.DATA_STREAM_SAMPLING)
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
    isBannerVisible(state) {
      const { client_flags = [] } = state.account
      return !client_flags.includes(state.flags.FORCE_REDIRECT_TO_CONSOLE)
    },
    isFirstLogin(state) {
      return state.account?.first_login
    },
    accountUtcOffset(state) {
      return state.account?.utc_offset || '+0000'
    },
    accountTimezone(state) {
      return state.account?.timezone
    },
    timezoneInfo() {
      return {
        timezone: this.accountTimezone,
        utcOffset: this.accountUtcOffset
      }
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
        state.accountStatuses.ONLINE,
        state.accountStatuses.REGULAR
      ].includes(state.account?.status)
    },
    showExportBilling(state) {
      return [state.accountStatuses.ONLINE, state.accountStatuses.TRIAL].includes(
        state.account?.status
      )
    },
    paymentReviewPending(state) {
      return [state.accountStatuses.BLOCKED, state.accountStatuses.DEFAULTING].includes(
        state.account?.status
      )
    },
    hasAccessToMarketplaceProducts(state) {
      const { flags, account } = state
      return account?.client_flags?.includes(flags.MARKETPLACE_PRODUCTS)
    },
    accountIsNotRegular(state) {
      return state.account?.status !== state.accountStatuses.REGULAR
    },

    hasHideCreateOptionsFlag(state) {
      return state.account?.client_flags?.includes(state.flags.HIDE_CREATE_OPTIONS)
    },
    isClientAccount(state) {
      return state.account?.kind === 'client'
    }
  },
  actions: {
    setAccountData(account) {
      this.account = { ...this.account, ...account }
    },
    setHasSession(value) {
      this.hasSession = !!value
    },
    resetAccount() {
      this.account = {}
      this.hasSession = false
      this.identifySignUpProvider = ''
    },
    setSsoSignUpMethod(method) {
      this.identifySignUpProvider = method
    },
    resetSsoSignUpMethod() {
      this.identifySignUpProvider = ''
    }
  }
})
