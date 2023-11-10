import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as DigitalCertificatesServices from '@/services/digital-certificates-services'
import * as EdgeApplicationServices from '@/services/edge-application-services'

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
        listDomainsService: DomainServices.listDomainsService,
        deleteDomainService: DomainServices.deleteDomainService,
        documentationService: Helpers.documentationCatalog.domains
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
      name: 'create-domain',
      component: () => import('@views/Domains/CreateView.vue'),
      props: {
        createDomainService: DomainServices.createDomainService,
        listDigitalCertificatesService: DigitalCertificatesServices.listDigitalCertificatesService,
        listEdgeApplicationsService: EdgeApplicationServices.listEdgeApplicationsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Domains',
            to: '/domains'
          },
          {
            label: 'Create Domain',
            to: '/domains/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-domain',
      component: () => import('@views/Domains/EditView.vue'),
      props: {
        editDomainService: DomainServices.editDomainService,
        listDigitalCertificatesService: DigitalCertificatesServices.listDigitalCertificatesService,
        listEdgeApplicationsService: EdgeApplicationServices.listEdgeApplicationsService,
        loadDomainService: DomainServices.loadDomainService
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
