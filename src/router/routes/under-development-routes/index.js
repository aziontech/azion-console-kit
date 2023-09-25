
/** @type {import('vue-router').RouteRecordRaw} */
export const underDevelopmentRoutes = {
  path: '/:catchAll(.*)',
  name: 'underDevelopment',
  component: () => import('@views/UnderDevelopment/UnderDevelopment.vue'),
}
