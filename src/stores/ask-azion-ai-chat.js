import { defineStore } from 'pinia'

export const useAskAzionAiChatStore = defineStore({
  id: 'askAzionAiChat',
  state: () => ({
    isOpen: false
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    close() {
      this.isOpen = false
    },
    open() {
      this.isOpen = true
    }
  },
  getters: {
    getStatus: (state) => state.isOpen
  }
})
