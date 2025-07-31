/** @type {import('vue-router').RouteRecordRaw} */
export const edgeStorageRoutes = {
  path: '/edge-storage',
  name: 'edge-storage',
  children: [
    {
      path: '',
      name: 'edge-storage-list',
      component: () => import('@views/EdgeStorage/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Storage',
            to: '/edge-storage'
          }
        ]
      }
    }
  ]
}
