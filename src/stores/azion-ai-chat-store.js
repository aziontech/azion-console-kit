import { defineStore } from 'pinia'

export const useAzionAiChatStore = defineStore({
  id: 'azion-ai-chat-store',
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
