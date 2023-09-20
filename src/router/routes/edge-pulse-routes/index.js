/** @type {import('vue-router').RouteRecordRaw} */
export const edgePulseRoutes = {
  path: '/edge-pulse',
  name: 'edge-pulse',
  children: [
    {
      path: '',
      name: 'edge-pulse',
      component: () => import('@views/EdgePulse/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Pulse',
            to: '/edge-pulse'
          }
        ]
      }
    }
  ]
}
