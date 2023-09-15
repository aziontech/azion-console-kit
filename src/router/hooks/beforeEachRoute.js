import { verify } from '@/services/login-services'

export default async function beforeEachRoute(to, from, next) {
  try {
    if(to.path === '/login') return next()

    await verify()
    next()
  } catch {
    next('/login')
  }
}