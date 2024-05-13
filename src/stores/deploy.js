import { defineStore } from 'pinia'

export const useDeploy = defineStore('deploy', {
  state: () => ({
    applicationName: '',
    startTime: null
  }),
  getters: {
    getApplicationName: (state) => state.applicationName,
    getStartTime: (state) => state.startTime
  },
  actions: {
    addApplicationName(applicationName) {
      this.applicationName = applicationName
    },
    addStartTime() {
      this.startTime = Date.now()
    },
    removeApplicationName() {
      this.applicationName = ''
    },
    removeStartTime() {
      this.startTime = null
    }
  },
  persist: true
})
