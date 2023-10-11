import {
  listDomainsService,
  loadDomainService,
  deleteDomainService,
  createDomainService,
  editDomainService
} from '@/services/domains-services'
import { listDigitalCertificatesService } from '@/services/digital-certificates-services'
import { listEdgeApplicationsService } from '@/services/edge-application-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const domainsRoutes = {
  path: '/domains',
  name: 'domains',
  children: [
    {
      path: '',
      name: 'list-domains',
      component: () => import('@views/Domains/ListView.vue'),
      props: {
        listDomainsService,
        deleteDomainService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-domains',
      component: () => import('@views/Domains/CreateView.vue'),
      props: {
        createDomainService,
        listDigitalCertificatesService,
        listEdgeApplicationsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          },
          {
            label: 'Create Domains',
            to: '/domains/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-domains',
      component: () => import('@views/Domains/EditView.vue'),
      props: {
        editDomainService,
        listDigitalCertificatesService,
        listEdgeApplicationsService,
        loadDomainService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          },
          {
            label: 'Edit Domain'
          }
        ]
      }
    }
  ]
}
