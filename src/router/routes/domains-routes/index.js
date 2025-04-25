import * as Helpers from '@/helpers'
import * as EdgeApplicationServicesV4 from '@/services/edge-application-services/v4'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'
import * as DigitalCertificatesServicesV4 from '@/services/digital-certificates-services/v4'
import * as WorkloadDeploymentServices from '@/services/workload-deployment-service'
import * as WorkloadServices from '@/services/workloads-services'
import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const domainsRoutes = {
  path: `/${TEXT_DOMAIN_WORKLOAD.pluralLabel}`,
  name: `/${TEXT_DOMAIN_WORKLOAD.pluralLabel}`,
  children: [
    {
      path: '',
      name: `list-${TEXT_DOMAIN_WORKLOAD.pluralLabel}`,
      component: () => import('@views/Domains/ListView.vue'),
      props: {
        listDomainsService: WorkloadServices.listWorkloadsService,
        deleteDomainService: WorkloadServices.deleteWorkloadService,
        documentationService: Helpers.documentationCatalog.domains,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: `${TEXT_DOMAIN_WORKLOAD.pluralTitle}`,
            to: `/${TEXT_DOMAIN_WORKLOAD.pluralLabel}`
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-domain',
      component: () => import('@views/Domains/CreateView.vue'),
      props: {
        createDomainService: WorkloadServices.createWorkloadService,
        listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
        loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsDropdownService,
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
            label: `${TEXT_DOMAIN_WORKLOAD.pluralTitle}`,
            to: `/${TEXT_DOMAIN_WORKLOAD.pluralLabel}`
          },
          {
            label: `Create ${TEXT_DOMAIN_WORKLOAD.singularTitle}`,
            to: `/${TEXT_DOMAIN_WORKLOAD.pluralLabel}/create`
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: `edit-${TEXT_DOMAIN_WORKLOAD.singularLabel}`,
      component: () => import('@views/Domains/TabsView.vue'),
      props: {
        domainServices: {
          editDomainService: WorkloadServices.editWorkloadService,
          loadDomainService: WorkloadServices.loadWorkloadService,
          updatedRedirect: `list-${TEXT_DOMAIN_WORKLOAD.pluralLabel}`,
          clipboardWrite: Helpers.clipboardWrite,
          listDigitalCertificatesService:
            DigitalCertificatesServicesV4.listDigitalCertificatesServiceDropdown,
          loadDigitalCertificatesService:
            DigitalCertificatesServicesV4.loadDigitalCertificateService
        },
        workloadDeploymentServices: {
          listWorkloadDeploymentService: WorkloadDeploymentServices.listWorkloadDeploymentsService,
          editWorkloadDeploymentService: WorkloadDeploymentServices.editWorkloadDeploymentService,
          listEdgeApplicationsService:
            EdgeApplicationServicesV4.listEdgeApplicationsDropdownService,
          loadEdgeApplicationsService:
            EdgeApplicationServicesV4.loadEdgeApplicationsDropdownService,
          listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
          loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService
        }
      },
      meta: {
        breadCrumbs: [
          {
            label: `${TEXT_DOMAIN_WORKLOAD.pluralTitle}`,
            to: `/${TEXT_DOMAIN_WORKLOAD.pluralLabel}`
          },
          {
            label: `Edit ${TEXT_DOMAIN_WORKLOAD.singularTitle}`
          }
        ]
      }
    }
  ]
}
