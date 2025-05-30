import * as EdgeApplicationServicesV4 from '@/services/edge-application-services/v4'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'
import * as DigitalCertificatesServicesV4 from '@/services/digital-certificates-services/v4'
import * as CustomPagesServicesV4 from '@/services/custom-pages-services/v4'

/** @type {import('vue-router').RouteRecordRaw} */
export const workloadRoutes = {
  path: `/workloads`,
  name: `/workloads`,
  children: [
    {
      path: '',
      name: `list-workloads`,
      component: () => import('@views/Workload/ListView.vue'),
      meta: {
        flag: 'checkout_access_without_flag',
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
        edgeApplicationServices: {
          listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
          loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsDropdownService
        },
        edgeFirewallServices: {
          listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
          loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService
        },
        digitalCertificatesServices: {
          listDigitalCertificatesService:
            DigitalCertificatesServicesV4.listDigitalCertificatesServiceDropdown,
          loadDigitalCertificatesService:
            DigitalCertificatesServicesV4.loadDigitalCertificateService
        },
        customPagesServices: {
          listCustomPagesService: CustomPagesServicesV4.listCustomPagesService,
          loadCustomPagesService: CustomPagesServicesV4.loadCustomPagesService
        }
      },
      meta: {
        flag: 'checkout_access_without_flag',
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
        updatedRedirect: `list-workloads`,
        edgeApplicationServices: {
          listEdgeApplicationsService: EdgeApplicationServicesV4.listEdgeApplicationsService,
          loadEdgeApplicationsService: EdgeApplicationServicesV4.loadEdgeApplicationsDropdownService
        },
        edgeFirewallServices: {
          listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
          loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService
        },
        digitalCertificatesServices: {
          listDigitalCertificatesService:
            DigitalCertificatesServicesV4.listDigitalCertificatesServiceDropdown,
          loadDigitalCertificatesService:
            DigitalCertificatesServicesV4.loadDigitalCertificateService
        },
        customPagesServices: {
          listCustomPagesService: CustomPagesServicesV4.listCustomPagesService,
          loadCustomPagesService: CustomPagesServicesV4.loadCustomPagesService
        }
      },
      meta: {
        flag: 'checkout_access_without_flag',
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
