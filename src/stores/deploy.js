import { defineStore } from 'pinia'

export const useDeploy = defineStore('deploy', {
  state: () => ({ applicationName: '' }),
  getters: {
    getApplicationName: (state) => state.applicationName
  },
  actions: {
    addApplicationName(applicationName) {
      this.applicationName = applicationName
    },
    removeApplicationName() {
      this.applicationName = ''
    }
  },
  persist: true
})
