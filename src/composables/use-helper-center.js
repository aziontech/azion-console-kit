import { reactive, computed, readonly } from 'vue'
import { getHelpCenterDocumentationService } from '@/services/help-center-services'
import { getDocumentationUrl } from '@/services/help-center-services/documentation-mapping'
import { useRoute } from 'vue-router'
const state = reactive({
  articleContent: null,
  mainContent: [],
  forcedPath: null
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
    setForcedPath(path) {
      state.forcedPath = path
    },
    clearForcedPath() {
      state.forcedPath = null
    },
    async setArticleContent({ url, filename = 'index.html' }) {
      state.articleContent = await getHelpCenterArticle(url, filename)
    },
    updatedMainContent: async (overridePath) => {
      const currentPath = overridePath ?? state.forcedPath ?? getCurrentPath()

      const { data } = await getHelpCenterDocumentationService({
        url: currentPath
      })

      state.mainContent = data
    },
    setMainContentByProduct: async (productIdentifier) => {
      const documentationUrl = getDocumentationUrl(productIdentifier)
      if (documentationUrl) {
        const { data } = await getHelpCenterDocumentationService({
          url: documentationUrl
        })
        state.mainContent = data
      }
    }
  }

  const getters = {
    getForcedPath: computed(() => state.forcedPath),
    getArticleContent: computed(() => state.articleContent),
    getMainContent: computed(() => state.mainContent),
    getHtmlArticle: async (filename) => {
      // Check if filename already contains a URL (starts with http or https)
      const isFullUrl = filename.startsWith('http://') || filename.startsWith('https://')

      if (isFullUrl) {
        // For full URLs, pass as url parameter with empty filename
        state.articleContent = await fetchArticleContent(filename, '')
      } else {
        const currentPath = state.forcedPath ?? getCurrentPath()
        const finalFilename = parseFilename(filename)
        state.articleContent = await fetchArticleContent(currentPath, finalFilename)
      }
    },
    getDocumentationContent: async (pathName) => {
      const { data } = await getHelpCenterDocumentationService({
        url: getDocumentationUrl(pathName)
      });


      state.articleContent = data;
    }
  }

  return {
    state: readonly(state),
    actions,
    getters
  }
}
