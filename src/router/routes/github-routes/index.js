/** @type {import('vue-router').RouteRecordRaw} */
export const gitHubRoutes = {
  path: '/gh-connect',
  name: 'gh-connect',
  component: () => import('@/views/GitHubConnectionPopup/index.vue')
}
