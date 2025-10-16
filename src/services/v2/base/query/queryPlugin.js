import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient, initializeQueryPersistence } from './queryClient'

export const queryPlugin = {
  install(app) {
    initializeQueryPersistence()

    app.use(VueQueryPlugin, {
      queryClient
    })
  }
}

export default queryPlugin
