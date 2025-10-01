/** @type {import('vue-router').RouteRecordRaw} */
export const edgeStorageRoutes = {
  path: '/object-storage',
  name: 'object-storage',
  meta: {
    title: 'Object Storage',
    flag: 'checkout_access_without_flag'
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
      props: {
        mode: 'view'
      },
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
      },
      alias: '/object-storage/:id'
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
      path: 'edit/:id',
      name: 'object-storage-bucket-settings',
      component: () => import('@/views/EdgeStorage/View.vue'),
      props: {
        mode: 'edit',
        updatedRedirect: 'object-storage-list'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Object Storage',
            to: '/object-storage'
          },
          {
            label: 'Bucket Settings'
          }
        ]
      }
    }
  ]
}
