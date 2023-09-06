import { defineStore } from 'pinia'

export const useIntelligentDNSStore = defineStore({
  id: 'intelligentDNS',
  state: () => ({
    domain: null
  }),
  persist: true,
  getters: {
    getDomain() {
      return this.domain.value
    }
  },
  actions: {
    addDomain(domain) {
      this.domain = domain
    }
  }
})
