import { defineStore } from 'pinia'

export const useHelpCenterStore = defineStore({
  id: 'helpCenter',
  state: () => ({
    isOpen: false
  }),
  actions: {
    toggleHelpCenter() {
      this.isOpen = !this.isOpen
    }
  }
})
