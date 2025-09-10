import { setupCLIConfig } from '@/helpers/redirect-cli'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function cliGuard({ to }) {
  if (to.name === 'login' && to.query?.next === 'cli') {
    setupCLIConfig(2, to.query?.callback_port)
    return { name: 'login' }
  }
}
