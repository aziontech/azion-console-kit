import { getHelpCenterDocumentationService } from '@/services/help-center-services'
import { defineStore } from 'pinia'

export const useHelpCenterStore = defineStore({
  id: 'helpCenter',
  state: () => ({
    isOpen: false,
    articleContent: null
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
      this.clearArticleContent()
    },
    close() {
      this.isOpen = false
      this.clearArticleContent()
    },
    open() {
      this.isOpen = true
    },
    clearArticleContent() {
      this.articleContent = null
    },
    async setArticleContent({ url, filename = 'index.html' }) {
      this.articleContent = await this.getHelpCenterArticle(url, filename)
      this.open()
    },
    async getHelpCenterArticle(url, filename) {
      const { data, success } = await getHelpCenterDocumentationService({ url, filename })

      return success ? data : null
    }
  },
  getters: {
    getStatus: (state) => state.isOpen,
    getArticleContent: (state) => state.articleContent
  }
})
