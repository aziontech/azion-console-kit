import { defineStore } from 'pinia'

export const useInfoBannerStore = defineStore({
  id: 'infoBanner',
  state: () => ({
    banners: []
  }),
  getters: {
    visibleBanners: (state) => state.banners.filter((banner) => banner.visible)
  },
  actions: {
    show({ id, severity = 'info', content }) {
      const existingIndex = this.banners.findIndex((item) => item.id === id)
      if (existingIndex >= 0) {
        this.banners[existingIndex] = { id, severity, content, visible: true }
      } else {
        this.banners.push({ id, severity, content, visible: true })
      }
    },
    hide(id) {
      const banner = this.banners.find((item) => item.id === id)
      if (banner) {
        banner.visible = false
      }
    },
    clear() {
      this.banners = []
    }
  }
})
