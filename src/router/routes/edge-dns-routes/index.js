import * as IntelligentDNSService from '@/services/intelligent-dns-services'
import * as IntelligentDNSRecordsService from '@/services/intelligent-dns-records-services'
import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeDnsRoutes = {
  path: '/edge-dns',
  name: 'edge-dns',
  children: [
    {
      path: '',
      name: 'list-edge-dns',
      component: () => import('@views/IntelligentDNS/ListView.vue'),
      props: {
        listIntelligentDNSService: IntelligentDNSService.listIntelligentDNSService,
        deleteIntelligentDNSService: IntelligentDNSService.deleteIntelligentDNSService,
        documentationService: Helpers.documentationCatalog.intelligentDNS,
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
      component: () => import('@views/IntelligentDNS/CreateView.vue'),
      props: {
        createIntelligentDNSService: IntelligentDNSService.createIntelligentDNSService,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge DNS',
            to: '/edge-dns'
          },
          {
            label: 'Create Edge DNS',
            to: '/edge-dns/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-edge-dns',
      component: () => import('@views/IntelligentDNS/EditView.vue'),
      props: {
        editIntelligentDNSService: IntelligentDNSService.editIntelligentDNSService,
        loadIntelligentDNSService: IntelligentDNSService.loadIntelligentDNSService,
        listRecordsService: IntelligentDNSRecordsService.listRecordsService,
        deleteRecordsService: IntelligentDNSRecordsService.deleteRecordsService,
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
            label: 'Edit Edge DNS'
          }
        ]
      }
    },
    {
      path: 'edit/:id/records',
      name: 'edge-dns-records',
      component: () => import('@views/IntelligentDNS/EditView.vue'),
      props: {
        editIntelligentDNSService: IntelligentDNSService.editIntelligentDNSService,
        loadIntelligentDNSService: IntelligentDNSService.loadIntelligentDNSService,
        listRecordsService: IntelligentDNSRecordsService.listRecordsService,
        deleteRecordsService: IntelligentDNSRecordsService.deleteRecordsService,
        createRecordsService: IntelligentDNSRecordsService.createRecordsService,
        editRecordsService: IntelligentDNSRecordsService.editRecordsService,
        loadRecordsService: IntelligentDNSRecordsService.loadRecordsService,
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
            label: 'Edit Edge DNS'
          }
        ]
      }
    }
  ]
}
