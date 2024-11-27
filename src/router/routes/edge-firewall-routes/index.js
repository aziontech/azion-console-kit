import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import * as EdgeFirewallServices from '@/services/edge-firewall-services'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'

import * as EdgeFirewallFunctionsServices from '@/services/edge-firewall-functions-services'
import * as EdgeFirewallFunctionsServicesV4 from '@/services/edge-firewall-functions-services/v4'

import * as EdgeFirewallRulesEngineServices from '@/services/edge-firewall-rules-engine-services'
import * as EdgeFirewallRulesEngineServicesV4 from '@/services/edge-firewall-rules-engine-services/v4'

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
        listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
        deleteEdgeFirewallService: EdgeFirewallServicesV4.deleteEdgeFirewallService,
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
        createEdgeFirewallService: EdgeFirewallServicesV4.createEdgeFirewallService
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
          loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService,
          editEdgeFirewallService: EdgeFirewallServicesV4.editEdgeFirewallService,

          listEdgeFunctionsService: EdgeFirewallFunctionsServices.listEdgeFunctionsService,
          listEdgeFirewallFunctionService:
            EdgeFirewallFunctionsServices.listEdgeFirewallFunctionsService,
          createFunctionService: EdgeFirewallFunctionsServicesV4.createFunctionService,
          editFunctionService: EdgeFirewallFunctionsServices.editFunctionService,
          deleteFunctionService: EdgeFirewallFunctionsServices.deleteFunctionService,
          loadFunctionService: EdgeFirewallFunctionsServices.loadFunctionService,

          documentationService: Helpers.documentationCatalog.edgeFirewall,
          updatedRedirect: 'list-edge-firewall'
        },
        rulesEngineServices: {
          listEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServicesV4.listEdgeFirewallRulesEngineService,
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
          documentationService: Helpers.documentationCatalog.edgeFirewallRulesEngine,
          reorderRulesEngine: EdgeFirewallRulesEngineServicesV4.reorderRulesEngine
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
