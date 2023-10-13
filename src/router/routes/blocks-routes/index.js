/** @type {import('vue-router').RouteRecordRaw} */
export const blocksRoutes = {
  path: '/blocks',
  name: 'blocks',
  component: () => import('@views/Blocks/BlocksView.vue')
}
