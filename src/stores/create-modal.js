import { defineStore } from 'pinia'

export const useCreateModalStore = defineStore({
  id: 'createModal',
  state: () => ({
    isOpen: false,
    initialTab: null
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    open(tab = null) {
      this.initialTab = tab
      this.isOpen = true
    },
    close() {
      this.isOpen = false
      this.initialTab = null
    }
  }
})
