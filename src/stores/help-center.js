import { defineStore } from 'pinia'

export const useHelpCenterStore = defineStore({
  id: 'helpCenter',
  state: () => ({
    isOpen: false,
    welcomeDefaultDocument: ''
  }),
  actions: {
    toggleHelpCenter() {
      this.isOpen = !this.isOpen
    },
    closeHelpCenter() {
      this.isOpen = false
    },
    setWelcomeDefaultDocument(payload) {
      this.welcomeDefaultDocument = payload
    }
  },
  getters: {
    getWelcomeDefaultDocument: (state) => state.welcomeDefaultDocument,
  },
})
