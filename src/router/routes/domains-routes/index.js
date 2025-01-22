import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as DomainServicesV4 from '@/services/domains-services/v4'
import * as EdgeApplicationServicesV4 from '@/services/edge-application-services/v4'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'
import * as DigitalCertificatesServicesV4 from '@/services/digital-certificates-services/v4'
import * as WorkloadDeploymentServices from '@/services/workload-deployment-service'
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
        listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
        loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsService,
        listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
        loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService,
        clipboardWrite: Helpers.clipboardWrite,
        listDigitalCertificatesService:
          DigitalCertificatesServicesV4.listDigitalCertificatesServiceDropdown,
        loadDigitalCertificatesService: DigitalCertificatesServicesV4.loadDigitalCertificateService
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
      path: 'edit/:id/:tab?',
      name: 'edit-domain',
      component: () => import('@views/Domains/TabsView.vue'),
      props: {
        domainServices: {
          editDomainService: DomainServicesV4.editDomainService,
          loadDomainService: DomainServicesV4.loadDomainService,
          updatedRedirect: 'list-domains',
          clipboardWrite: Helpers.clipboardWrite,
          listDigitalCertificatesService:
            DigitalCertificatesServicesV4.listDigitalCertificatesServiceDropdown,
          loadDigitalCertificatesService:
            DigitalCertificatesServicesV4.loadDigitalCertificateService
        },
        workloadDeploymentServices: {
          listWorkloadDeploymentService: WorkloadDeploymentServices.listWorkloadDeploymentsService,
          editWorkloadDeploymentService: WorkloadDeploymentServices.editWorkloadDeploymentService,
          listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
          loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsService,
          listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
          loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService
        }
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
