/** @type {import('vue-router').RouteRecordRaw} */
export const edgeStorageRoutes = {
  path: '/object-storage',
  name: 'object-storage',
  meta: {
    title: 'Object Storage'
  },
  children: [
    {
      path: '',
      name: 'object-storage-list',
      component: () => import('@views/EdgeStorage/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/object-storage'
          }
        ]
      }
    },
    {
      path: ':id',
      name: 'object-storage-view',
      component: () => import('@/views/EdgeStorage/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/object-storage'
          },
          {
            label: 'Edit Bucket',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'object-storage-create',
      component: () => import('@/views/EdgeStorage/View.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/object-storage'
          },
          {
            label: 'Create Bucket',
            to: '/object-storage/create'
          }
        ]
      }
    },
    {
      path: ':id/edit/:tab?',
      name: 'object-storage-edit',
      component: () => import('@/views/EdgeStorage/View.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/object-storage'
          },
          {
            label: 'Edit Bucket',
            to: '/object-storage/:id',
            dynamic: true,
            routeParam: 'id'
          },
          {
            label: 'Bucket Settings'
          }
        ]
      }
    }
  ]
}
