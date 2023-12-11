import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loadingProgress', {
  state: () => ({ isLoading: false }),
  getters: {
    showLoading: (state) => state.isLoading
  },
  actions: {
    startLoading() {
      this.isLoading = true
    },
    finishLoading() {
      this.isLoading = false
    }
  }
})
