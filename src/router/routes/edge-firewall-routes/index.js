import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'

import * as EdgeFirewall from '@/services/edge-firewall-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeFirewallRoutes = {
  path: '/edge-firewall',
  name: 'edge-firewall',
  children: [
    {
      path: '',
      name: 'list-edge-firewall',
      component: () => import('@views/EdgeFirewall/ListView.vue'),
      props: {
        listEdgeFirewallService: EdgeFirewall.listEdgeFirewallService,
        deleteEdgeFirewallService: EdgeFirewall.deleteEdgeFirewallService,
        documentationService: Helpers.documentationCatalog.edgeFirewall
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Firewall',
            to: '/edge-firewall'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-firewall',
      component: () => import('@views/EdgeFirewall/CreateView.vue'),
      props: {
        listDomainsService: DomainServices.listDomainsService,
        createEdgeFirewallServices: EdgeFirewall.createEdgeFirewallService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Firewall',
            to: '/edge-firewall'
          },
          {
            label: 'Create New',
            to: '/edge-firewall/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:resources?',
      name: 'edit-edge-firewall',
      component: () => import('@/views/EdgeFirewall/TabsView.vue'),
      props: {
        // loadEdgeService: EdgeServiceServices.loadEdgeServiceServices,
        // editEdgeService: EdgeServiceServices.editEdgeServiceServices,
        // listResourcesServices: EdgeServiceResourcesServices.listResourcesServices,
        // deleteResourcesServices: EdgeServiceResourcesServices.deleteResourcesServices,
        // editResourcesServices: EdgeServiceResourcesServices.editResourcesServices,
        // createResourcesServices: EdgeServiceResourcesServices.createResourcesServices,
        // loadResourcesServices: EdgeServiceResourcesServices.loadResourcesServices,
        // documentationServiceResource: Helpers.documentationGuideProducts.edgeServicesResources,
        // updatedRedirect: 'list-edge-services'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Firewall',
            to: '/edge-firewall'
          },
          {
            label: 'Edit Rule Set'
          }
        ]
      }
    }
  ]
}
