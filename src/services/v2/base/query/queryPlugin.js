import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient, initializeQueryPersistence } from './queryClient'

export const queryPlugin = {
  install(app) {
    // Initialize persistence before setting up the plugin
    initializeQueryPersistence()

    // Install Vue Query plugin
    app.use(VueQueryPlugin, {
      queryClient
    })
  }
}

export default queryPlugin
