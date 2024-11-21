import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as DomainServicesV4 from '@/services/domains-services/v4'
import * as DigitalCertificatesServices from '@/services/digital-certificates-services'
import * as EdgeApplicationServicesV4 from '@/services/edge-application-services/v4'

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
        listDomainsService: DomainServicesV4.listDomainsService,
        deleteDomainService: DomainServices.deleteDomainService,
        documentationService: Helpers.documentationCatalog.domains,
        clipboardWrite: Helpers.clipboardWrite
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
        listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
        loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsService,
        clipboardWrite: Helpers.clipboardWrite
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
        listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
        loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsService,
        loadDomainService: DomainServices.loadDomainService,
        updatedRedirect: 'list-domains',
        clipboardWrite: Helpers.clipboardWrite
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
