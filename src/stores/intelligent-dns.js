import { defineStore } from 'pinia'

export const useIntelligentDNSStore = defineStore({
  id: 'intelligentDNS',
  state: () => ({
    domain: null
  }),
  getters: {
    getDomain() {
      return this.domain ? this.domain.value : localStorage.getItem('domain');
    },
  },
  actions: {
    addDomain(domain) {
      this.domain = domain
      localStorage.setItem("domain", domain.value);
    }
  },
});
