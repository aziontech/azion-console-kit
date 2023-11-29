import { defineStore } from 'pinia'

export const useCreateModalStore = defineStore({
  id: 'createModal',
  state: () => ({
    isOpen: false
  }),
  actions: {
    toggleCreate() {
      this.isOpen = !this.isOpen
    },
    closeCreate() {
      this.isOpen = false
    }
  }
})
