import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const dataStreamRoutes = {
  path: '/data-stream',
  name: 'data-stream',
  children: [
    {
      path: '',
      name: 'list-data-stream',
      component: () => import('@views/DataStream/ListView.vue'),
      props: {
        documentationService: Helpers.documentationCatalog.dataStream
      },
      meta: {
        title: 'Data Stream',
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-stream'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-data-stream',
      component: () => import('@views/DataStream/CreateView.vue'),
      meta: {
        title: 'Create Data Stream',
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-stream'
          },
          {
            label: 'Create Stream',
            to: '/data-stream/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-data-stream',
      component: () => import('@views/DataStream/EditView.vue'),
      props: {
        updatedRedirect: 'list-data-stream'
      },
      meta: {
        title: 'Edit Data Stream',
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-stream'
          },
          {
            label: 'Edit Stream'
          }
        ]
      }
    }
  ]
}
