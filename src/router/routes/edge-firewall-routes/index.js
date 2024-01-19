import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as EdgeFirewall from '@/services/edge-firewall-services'
import * as EdgeFirewallFunctions from '@/services/edge-firewall-functions-services'

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
        createEdgeFirewallService: EdgeFirewall.createEdgeFirewallService
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
      path: 'edit/:id/:tab?',
      name: 'edit-edge-firewall',
      component: () => import('@/views/EdgeFirewall/TabsView.vue'),
      props: {
        edgeFirewallServices: {
          createEdgeFirewallService: EdgeFirewall.createEdgeFirewallService,
          loadEdgeFirewallService: EdgeFirewall.loadEdgeFirewallService,
          editEdgeFirewallService: EdgeFirewall.editEdgeFirewallService,

          listEdgeFunctionsService: EdgeFirewallFunctions.listEdgeFunctionsService,
          listEdgeFirewallFunctionService: EdgeFirewallFunctions.listEdgeFirewallFunctionsService,
          createFunctionService: EdgeFirewallFunctions.createFunctionService,
          editFunctionService: EdgeFirewallFunctions.editFunctionService,
          deleteFunctionService: EdgeFirewallFunctions.deleteFunctionService,
          loadFunctionService: EdgeFirewallFunctions.loadFunctionService,
          documentationService: Helpers.documentationCatalog.edgeFirewall,
          updatedRedirect: 'list-edge-firewall'
        },
        listDomainsService: DomainServices.listDomainsService
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
