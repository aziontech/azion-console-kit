import * as EdgeDNSServiceV4 from '@/services/edge-dns-services/v4'
import * as EdgeDNSRecordsServiceV4 from '@/services/edge-dns-records-services/v4'
import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeDnsRoutes = {
  path: '/edge-dns',
  name: 'edge-dns',
  children: [
    {
      path: '',
      name: 'list-edge-dns',
      component: () => import('@views/EdgeDNS/ListView.vue'),
      props: {
        listEdgeDNSService: EdgeDNSServiceV4.listEdgeDNSService,
        deleteEdgeDNSService: EdgeDNSServiceV4.deleteEdgeDnsZoneService,
        documentationService: Helpers.documentationCatalog.edgeDNS,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-dns',
      component: () => import('@views/EdgeDNS/CreateView.vue'),
      props: {
        createEdgeDNSService: EdgeDNSServiceV4.createEdgeDNSZonesService,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Create Zone',
            to: '/edge-dns/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-edge-dns',
      component: () => import('@views/EdgeDNS/EditView.vue'),
      props: {
        editEdgeDNSService: EdgeDNSServiceV4.editEdgeDNSService,
        loadEdgeDNSService: EdgeDNSServiceV4.loadEdgeDNSService,
        listRecordsService: EdgeDNSRecordsServiceV4.listRecordsService,
        deleteRecordsService: EdgeDNSRecordsServiceV4.deleteRecordsService,
        clipboardWrite: Helpers.clipboardWrite,
        updatedRedirect: 'list-edge-dns'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Edit Zone'
          }
        ]
      }
    },
    {
      path: 'edit/:id/records',
      name: 'edge-dns-records',
      component: () => import('@views/EdgeDNS/EditView.vue'),
      props: {
        listRecordsService: EdgeDNSRecordsServiceV4.listRecordsService,
        deleteRecordsService: EdgeDNSRecordsServiceV4.deleteRecordsService,
        createRecordsService: EdgeDNSRecordsServiceV4.createRecordsService,
        editRecordsService: EdgeDNSRecordsServiceV4.editRecordsService,
        loadRecordsService: EdgeDNSRecordsServiceV4.loadRecordsService,
        clipboardWrite: Helpers.clipboardWrite,
        documentationService: Helpers.documentationCatalog.records
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Edit Record'
          }
        ]
      }
    }
  ]
}
