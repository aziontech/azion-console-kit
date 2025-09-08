import { setupCLIConfig } from '@/helpers/redirect-cli'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function cliGuard({ to }) {
  if (to.name === 'login' && to.query?.next === 'cli') {
    setupCLIConfig()
    return { name: 'login' }
  }
}
