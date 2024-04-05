/** @type {import('vue-router').RouteRecordRaw} */
export const githubRoutes = {
  path: '/gh-connect',
  name: 'gh-connect',
  component: () => import('@/views/GitHubConnectionPopup/index.vue')
}
