import { defineStore } from 'pinia'

export const useCreateModalStore = defineStore({
  id: 'createModal',
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
  }
})
