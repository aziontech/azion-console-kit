/** @type {import('vue-router').RouteRecordRaw} */
export const edgeStorageRoutes = {
  path: '/edge-storage',
  name: 'edge-storage',
  meta: {
    flag: 'checkout_access_without_flag'
  },
  children: [
    {
      path: '',
      name: 'edge-storage-list',
      component: () => import('@views/EdgeStorage/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/edge-storage'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'edge-storage-create',
      component: () => import('@/views/EdgeStorage/View.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/edge-storage'
          },
          {
            label: 'Create Bucket',
            to: '/edge-storage/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edge-storage-bucket-settings',
      component: () => import('@/views/EdgeStorage/View.vue'),
      props: {
        mode: 'edit',
        updatedRedirect: 'edge-storage-list'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/edge-storage'
          },
          {
            label: 'Bucket Settings'
          }
        ]
      }
    }
  ]
}
