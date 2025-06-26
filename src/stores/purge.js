// stores/usePurgeStore.js
import { defineStore } from 'pinia'

export const usePurgeStore = defineStore('purge', {
  state: () => ({
    purgeCount: 0
  }),

  getters: {
    getPurgeCount: (state) => state.purgeCount
  },

  actions: {
    setPurgeCount(count) {
      this.purgeCount = count
    },

    incrementPurgeCount() {
      this.purgeCount++
    }
  }
})
