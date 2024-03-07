import { defineStore } from 'pinia'

export const useEdgeDNSStore = defineStore({
  id: 'edgeDNS',
  state: () => ({
    domain: null
  }),
  persist: true,
  getters: {
    getDomain() {
      return this.domain
    }
  },
  actions: {
    addDomain(domain) {
      this.domain = domain
    }
  }
})
