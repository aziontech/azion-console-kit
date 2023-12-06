import { defineStore } from 'pinia'

export const loadingStore = defineStore('loadingProgress', {
  state: () => ({ show: false }),
  actions: {
    showLoading() {
      this.show = true
    },
    hideLoading() {
      this.show = false
    }
  }
})
