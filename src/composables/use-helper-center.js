import { reactive, computed, readonly } from 'vue'
import { getHelpCenterDocumentationService } from '@/services/help-center-services'
import { useRoute } from 'vue-router'
const state = reactive({
  articleContent: null,
  mainContent: []
})

export function useHelperCenter() {
  const route = useRoute()

  const getCurrentPath = () => {
    const match = route.path.match(/(.*\/)(edit|solution)/)
    return match ? `${match[1]}${match[2]}` : route.path
  }

  const parseFilename = (filename) => {
    const article = filename.replaceAll(' ', '-').toLowerCase()
    const [articleNameParsed] = article.split('#')

    return articleNameParsed.concat('/index.html')
  }

  const fetchArticleContent = async (currentPath, filename) => {
    const { data } = await getHelpCenterDocumentationService({
      url: currentPath,
      filename: filename
    })

    return data
  }

  const getHelpCenterArticle = async (url, filename) => {
    const { data, success } = await getHelpCenterDocumentationService({ url, filename })
    return success ? data : null
  }

  const actions = {
    clearArticleContent() {
      state.articleContent = null
    },
    async setArticleContent({ url, filename = 'index.html' }) {
      state.articleContent = await getHelpCenterArticle(url, filename)
    },
    updatedMainContent: async () => {
      const currentPath = getCurrentPath()

      const { data } = await getHelpCenterDocumentationService({
        url: currentPath
      })

      state.mainContent = data
    }
  }

  const getters = {
    getArticleContent: computed(() => state.articleContent),
    getMainContent: computed(() => state.mainContent),
    getHtmlArticle: async (filename) => {
      const currentPath = getCurrentPath()
      const parsedFilename = parseFilename(filename)

      state.articleContent = await fetchArticleContent(currentPath, parsedFilename)
    }
  }

  return {
    state: readonly(state),
    actions,
    getters
  }
}
