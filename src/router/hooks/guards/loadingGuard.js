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
    setupCLIConfig(2, to.query?.callback_port)
    return { name: 'login' }
  }
}
