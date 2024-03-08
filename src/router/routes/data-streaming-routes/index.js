import * as Helpers from '@/helpers'
import * as DataStreamingService from '@/services/data-streaming-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const dataStreamingRoutes = {
  path: '/data-streaming',
  name: 'data-streaming',
  children: [
    {
      path: '',
      name: 'list-data-streaming',
      component: () => import('@views/DataStreaming/ListView.vue'),
      props: {
        listDataStreamingService: DataStreamingService.listDataStreamingService,
        deleteDataStreamingService: DataStreamingService.deleteDataStreamingService,
        documentationService: Helpers.documentationCatalog.dataStreaming
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-streaming'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-data-streaming',
      component: () => import('@views/DataStreaming/CreateView.vue'),
      props: {
        listDataStreamingTemplateService: DataStreamingService.listDataStreamingTemplateService,
        listDataStreamingDomainsService: DataStreamingService.listDataStreamingDomainsService,
        createDataStreamingService: DataStreamingService.createDataStreamingService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-streaming'
          },
          {
            label: 'Create Data Stream',
            to: '/data-streaming/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-data-streaming',
      component: () => import('@views/DataStreaming/EditView.vue'),
      props: {
        listDataStreamingTemplateService: DataStreamingService.listDataStreamingTemplateService,
        listDataStreamingDomainsService: DataStreamingService.listDataStreamingDomainsService,
        loadDataStreamingService: DataStreamingService.loadDataStreamingService,
        editDataStreamingService: DataStreamingService.editDataStreamingService,
        updatedRedirect: 'list-data-streaming'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Data Stream',
            to: '/data-streaming'
          },
          {
            label: 'Edit Data Stream'
          }
        ]
      }
    }
  ]
}
