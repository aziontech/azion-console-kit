/** @type {import('vue-router').RouteRecordRaw} */
export const homeRoutes = {
  path: '/',
  name: 'home',
  component: () => import('@views/Home/HomeView.vue')
}
