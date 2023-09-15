import { logout, verify } from '@/services/login-services'

export default async function beforeEachRoute(to, _, next) {
  try {
    if (to.path === '/login') return next()
    if (to.path === '/logout') {
      await logout()
      return next()
    }

    await verify()
    next()
  } catch {
    next('/login')
  }
}