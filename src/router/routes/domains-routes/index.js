import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as DomainServicesV4 from '@/services/domains-services/v4'
import * as DigitalCertificatesServices from '@/services/digital-certificates-services'
import * as EdgeApplicationServices from '@/services/edge-application-services'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'

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
        listEdgeApplicationsService: EdgeApplicationServices.listEdgeApplicationsService,
        listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
        loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService,
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
        listEdgeApplicationsService: EdgeApplicationServices.listEdgeApplicationsService,
        loadDomainService: DomainServices.loadDomainService,
        listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
        loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService,
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
