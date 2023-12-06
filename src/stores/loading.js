import { defineStore } from 'pinia'

export const loadingStore = defineStore('loadingProgress', {
  state: () => ({ isLoading: false }),
  actions: {
    setLoading() {
      this.isLoading = true
    },
    hideLoading() {
      this.isLoading = false
    }
  }
})
