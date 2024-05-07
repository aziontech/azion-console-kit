import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as EdgeFirewallServices from '@/services/edge-firewall-services'
import * as EdgeFirewallFunctionsServices from '@/services/edge-firewall-functions-services'
import * as EdgeFirewallRulesEngineServices from '@/services/edge-firewall-rules-engine-services'
import * as WafRulesServices from '@/services/waf-rules-services'
import * as NetworkListsService from '@/services/network-lists-services'

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
        listEdgeFirewallService: EdgeFirewallServices.listEdgeFirewallService,
        deleteEdgeFirewallService: EdgeFirewallServices.deleteEdgeFirewallService,
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
        createEdgeFirewallService: EdgeFirewallServices.createEdgeFirewallService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Firewall',
            to: '/edge-firewall'
          },
          {
            label: 'Create Edge Firewall',
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
        listDomainsService: DomainServices.listDomainsService,
        listNetworkListService: NetworkListsService.listNetworkListService,
        edgeFirewallServices: {
          createEdgeFirewallService: EdgeFirewallServices.createEdgeFirewallService,
          loadEdgeFirewallService: EdgeFirewallServices.loadEdgeFirewallService,
          editEdgeFirewallService: EdgeFirewallServices.editEdgeFirewallService,

          listEdgeFunctionsService: EdgeFirewallFunctionsServices.listEdgeFunctionsService,
          listEdgeFirewallFunctionService:
            EdgeFirewallFunctionsServices.listEdgeFirewallFunctionsService,
          createFunctionService: EdgeFirewallFunctionsServices.createFunctionService,
          editFunctionService: EdgeFirewallFunctionsServices.editFunctionService,
          deleteFunctionService: EdgeFirewallFunctionsServices.deleteFunctionService,
          loadFunctionService: EdgeFirewallFunctionsServices.loadFunctionService,
          documentationService: Helpers.documentationCatalog.edgeFirewall,
          updatedRedirect: 'list-edge-firewall'
        },
        rulesEngineServices: {
          listEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServices.listEdgeFirewallRulesEngineService,
          deleteEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServices.deleteEdgeFirewallRulesEngineService,
          createEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServices.createEdgeFirewallRulesEngineService,
          loadEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServices.loadEdgeFirewallRulesEngineService,
          editEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServices.editEdgeFirewallRulesEngineService,

          listFunctionsService: EdgeFirewallFunctionsServices.listFunctionsService,
          listWafRulesService: WafRulesServices.listWafRulesService,
          documentationService: Helpers.documentationCatalog.edgeFirewallRulesEngine
        }
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Firewall',
            to: '/edge-firewall'
          },
          {
            label: 'Edit Edge Firewall'
          }
        ]
      }
    }
  ]
}
