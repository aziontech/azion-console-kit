import { defineStore } from 'pinia'

export const useHelpCenterStore = defineStore({
  id: 'helpCenter',
  state: () => ({
    isOpen: false
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    close() {
      this.isOpen = false
    }
  },
  getters: {
    getStatus: (state) => state.isOpen
  }
})
