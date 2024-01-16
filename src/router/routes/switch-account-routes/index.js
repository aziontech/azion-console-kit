import { switchAccountFromSocialIdp } from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const switchAccountRoutes = {
  path: '/switch-account',
  name: 'switch-account',
  meta: {
    isPublic: true
  },
  beforeEnter: async (_, __, next) => {
    try {
      const redirect = await switchAccountFromSocialIdp()
      next(redirect)
    } catch {
      next({ name: 'login' })
    }
  }
}
