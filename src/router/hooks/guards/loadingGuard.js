import { setupCLIConfig } from '@/helpers/redirect-cli'
import { useLoadingStore } from '@/stores/loading'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function loadingGuard({ to }) {
  const loadingStore = useLoadingStore()

  loadingStore.startLoading()

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }

  if (to.name === 'login' && to.query?.next === 'cli') {
    setupCLIConfig()
    return { name: 'login' }
  }
}
