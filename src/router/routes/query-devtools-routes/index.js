/** @type {import('vue-router').RouteRecordRaw} */
export const queryDevtoolsRoutes = {
  path: '/devtools/query',
  name: 'query-devtools',
  component: () => import('@views/QueryDevtools/QueryDevtoolsView.vue')
}
