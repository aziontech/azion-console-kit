import * as IntelligentDNSService from '@/services/intelligent-dns-services'
import * as IntelligentDNSRecordsService from '@/services/intelligent-dns-records-services'
import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const intelligentDnsRoutes = {
  path: '/intelligent-dns',
  name: 'intelligent-dns',
  children: [
    {
      path: '',
      name: 'list-intelligent-dns',
      component: () => import('@views/IntelligentDNS/ListView.vue'),
      props: {
        listIntelligentDNSService: IntelligentDNSService.listIntelligentDNSService,
        deleteIntelligentDNSService: IntelligentDNSService.deleteIntelligentDNSService,
        documentationService: Helpers.documentationCatalog.intelligentDNS
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Intelligent DNS',
            to: '/intelligent-dns'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-intelligent-dns',
      component: () => import('@views/IntelligentDNS/CreateView.vue'),
      props: {
        createIntelligentDNSService: IntelligentDNSService.createIntelligentDNSService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Intelligent DNS',
            to: '/intelligent-dns'
          },
          {
            label: 'Create Intelligent DNS',
            to: '/intelligent-dns/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-intelligent-dns',
      component: () => import('@views/IntelligentDNS/EditView.vue'),
      props: {
        editIntelligentDNSService: IntelligentDNSService.editIntelligentDNSService,
        loadIntelligentDNSService: IntelligentDNSService.loadIntelligentDNSService,
        listRecordsService: IntelligentDNSRecordsService.listRecordsService,
        deleteRecordsService: IntelligentDNSRecordsService.deleteRecordsService,
        updatedRedirect: 'list-intelligent-dns'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Intelligent DNS',
            to: '/intelligent-dns'
          },
          {
            label: 'Edit Intelligent DNS'
          }
        ]
      }
    },
    {
      path: 'edit/:id/records',
      name: 'intelligent-dns-records',
      component: () => import('@views/IntelligentDNS/EditView.vue'),
      props: {
        editIntelligentDNSService: IntelligentDNSService.editIntelligentDNSService,
        loadIntelligentDNSService: IntelligentDNSService.loadIntelligentDNSService,
        listRecordsService: IntelligentDNSRecordsService.listRecordsService,
        deleteRecordsService: IntelligentDNSRecordsService.deleteRecordsService,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Intelligent DNS',
            to: '/intelligent-dns'
          },
          {
            label: 'Edit Intelligent DNS'
          }
        ]
      }
    },
    {
      path: 'edit/:id/records/create',
      name: 'intelligent-dns-records-create',
      component: () => import('@views/IntelligentDNS/CreateRecordsView.vue'),
      props: {
        createRecordsService: IntelligentDNSRecordsService.createRecordsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Intelligent DNS',
            to: '/intelligent-dns'
          },
          {
            label: 'Create Records'
          }
        ]
      }
    },
    {
      path: 'edit/:intelligentDNSId/records/edit/:id',
      name: 'intelligent-dns-records-edit',
      component: () => import('@views/IntelligentDNS/EditRecordsView.vue'),
      props: {
        editRecordsService: IntelligentDNSRecordsService.editRecordsService,
        loadRecordsService: IntelligentDNSRecordsService.loadRecordsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Intelligent DNS',
            to: '/intelligent-dns'
          },
          {
            label: 'Edit Record'
          }
        ]
      }
    }
  ]
}
