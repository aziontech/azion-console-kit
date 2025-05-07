import * as Helpers from '@/helpers'
import * as EdgeApplicationServicesV4 from '@/services/edge-application-services/v4'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'
import * as DigitalCertificatesServicesV4 from '@/services/digital-certificates-services/v4'
import * as CustomPagesServicesV4 from '@/services/custom-pages-services/v4'
import * as WorkloadDeploymentServices from '@/services/workload-deployment-service'
import * as WorkloadServices from '@/services/workloads-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const workloadRoutes = {
  path: `/workloads`,
  name: `/workloads`,
  children: [
    {
      path: '',
      name: `list-workloads`,
      component: () => import('@views/Workload/ListView.vue'),
      props: {
        listDomainsService: WorkloadServices.listWorkloadsService,
        deleteDomainService: WorkloadServices.deleteWorkloadService,
        documentationService: Helpers.documentationCatalog.domains,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: `Workloads`,
            to: `/workloads`
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-workload',
      component: () => import('@views/Workload/CreateView.vue'),
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
            label: `Workloads`,
            to: `/workloads`
          },
          {
            label: `Create Workload`,
            to: `/workloads/create`
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: `edit-workload`,
      component: () => import('@views/Workload/TabsView.vue'),
      props: {
        domainServices: {
          editDomainService: WorkloadServices.editWorkloadService,
          loadDomainService: WorkloadServices.loadWorkloadService,
          updatedRedirect: `list-workloads`,
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
        },
        customPagesServices: {
          listCustomPagesService: CustomPagesServicesV4.listCustomPagesService,
          loadCustomPagesService: CustomPagesServicesV4.loadCustomPagesService
        }
      },
      meta: {
        breadCrumbs: [
          {
            label: `Workloads`,
            to: `/workloads`
          },
          {
            label: `Edit Workload`
          }
        ]
      }
    }
  ]
}
