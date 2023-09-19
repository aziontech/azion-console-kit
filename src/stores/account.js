import { defineStore } from 'pinia'

export const useAccountStore = defineStore({
  id: 'account',
  state: () => ({
    account: null
  }),
  getters: {
    getAccountData(state) {
      return state.account
    },
    hasActiveUserId(state) {
      return !!state.account?.user_tracking_info?.id
    }
  },
  actions: {
    setAccountData(account) {
      this.account = account
    }
  }
})
