import { defineStore } from 'pinia'

export const useRealTimeEventsPreferenceStore = defineStore('realTimeEventsPreference', {
  state: () => ({
    viewVersion: 'v1'
  }),
  getters: {
    isV2: (state) => state.viewVersion === 'v2',
    targetRouteName: (state) =>
      state.viewVersion === 'v2' ? 'real-time-events-v2' : 'real-time-events'
  },
  actions: {
    setVersion(version) {
      if (version === 'v1' || version === 'v2') {
        this.viewVersion = version
      }
    },
    toggleVersion() {
      this.viewVersion = this.viewVersion === 'v1' ? 'v2' : 'v1'
    }
  },
  persist: {
    key: 'azion-rte-view-version',
    storage: localStorage,
    paths: ['viewVersion']
  }
})
