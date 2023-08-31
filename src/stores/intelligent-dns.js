import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useIntelligentDNSStore = defineStore('intelligentDNS', () => {
  const domain = ref('mydomain.com')

  function insertDomain(domainProps) {
    domain.value = domainProps
  }

  return { domain, insertDomain }
})
