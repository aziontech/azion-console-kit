import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient, initializeQueryPersistence } from './queryClient'

export const queryPlugin = {
  install(app) {
    initializeQueryPersistence().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize query persistence:', error)
    })

    app.use(VueQueryPlugin, {
      queryClient
    })
  }
}

export default queryPlugin
