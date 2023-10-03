/** @type {import('vue-router').RouteRecordRaw} */
export const playgroundRoutes = {
  path: '/playground',
  name: 'playground',

  component: () => import('@views/Playground/PlaygroundView.vue'),
}
