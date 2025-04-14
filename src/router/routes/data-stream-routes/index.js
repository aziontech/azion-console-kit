import * as Helpers from '@/helpers'
import * as DataStreamService from '@/services/data-stream-services'
import * as DataStreamServiceV4 from '@/services/data-stream-services/v4'

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
        listDataStreamService: DataStreamService.listDataStreamService,
        deleteDataStreamService: DataStreamService.deleteDataStreamService,
        documentationService: Helpers.documentationCatalog.dataStream
      },
      meta: {
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
      props: {
        listDataStreamTemplateService: DataStreamService.listDataStreamTemplateService,
        listDataStreamDomainsService: DataStreamService.listDataStreamDomainsService,
        createDataStreamService: DataStreamService.createDataStreamService
      },
      meta: {
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
        listDataStreamTemplateService: DataStreamService.listDataStreamTemplateService,
        listDataStreamDomainsService: DataStreamService.listDataStreamDomainsService,
        loadDataStreamService: DataStreamServiceV4.loadDataStreamService,
        editDataStreamService: DataStreamService.editDataStreamService,
        updatedRedirect: 'list-data-stream'
      },
      meta: {
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
