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
    },
    {
      path: 'create',
      name: 'edge-storage-create',
      component: () => import('@/views/EdgeStorage/CustomView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Storage',
            to: '/edge-storage'
          },
          {
            label: 'Create Bucket',
            to: '/edge-storage/create'
          }
        ]
      }
    }
  ]
}
