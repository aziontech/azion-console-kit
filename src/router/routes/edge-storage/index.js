import * as EdgeStorageServices from '@/services/v2/edge-storage-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeStorageRoutes = {
  path: '/edge-storage',
  name: 'edge-storage',
  children: [
    {
      path: '',
      name: 'edge-storage-list',
      component: () => import('@views/EdgeStorage/ListView.vue'),
      props: {
        listEdgeStorageBucketsService: EdgeStorageServices.listEdgeStorageBuckets
      },
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
      component: () => import('@views/EdgeStorage/CreateView.vue'),
      props: {
        createEdgeStorageBucketService: EdgeStorageServices.createEdgeStorageBucket
      },
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
