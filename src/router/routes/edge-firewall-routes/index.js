import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'

import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'

import * as EdgeFirewallFunctionsServices from '@/services/edge-firewall-functions-services'
import * as EdgeFirewallFunctionsServicesV4 from '@/services/edge-firewall-functions-services/v4'

import * as EdgeFunctionServiceV4 from '@/services/edge-functions-services/v4'
import * as EdgeFirewallRulesEngineServicesV4 from '@/services/edge-firewall-rules-engine-services/v4'

import * as WafRulesServices from '@/services/waf-rules-services/v4'

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
        edgeFirewallServices: {
          loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService,
          editEdgeFirewallService: EdgeFirewallServicesV4.editEdgeFirewallService,
          listEdgeFirewallFunctionService:
            EdgeFirewallFunctionsServices.listEdgeFirewallFunctionsService,
          createFunctionService: EdgeFirewallFunctionsServicesV4.createFunctionService,
          editFunctionService: EdgeFirewallFunctionsServicesV4.editFunctionService,
          deleteFunctionService: EdgeFirewallFunctionsServicesV4.deleteFunctionService,
          loadFunctionService: EdgeFirewallFunctionsServicesV4.loadFunctionService,

          listEdgeFunctionsService: EdgeFunctionServiceV4.listEdgeFunctionsDropdownService,
          loadEdgeFunctionService: EdgeFunctionServiceV4.loadEdgeFunctionService,

          documentationService: Helpers.documentationCatalog.edgeFirewall,
          updatedRedirect: 'list-edge-firewall'
        },
        rulesEngineServices: {
          listEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServicesV4.listEdgeFirewallRulesEngineService,
          deleteEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServicesV4.deleteEdgeFirewallRulesEngineService,
          createEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServicesV4.createEdgeFirewallRulesEngineService,
          loadEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServicesV4.loadEdgeFirewallRulesEngineService,
          editEdgeFirewallRulesEngineService:
            EdgeFirewallRulesEngineServicesV4.editEdgeFirewallRulesEngineService,
          listFunctionsService: EdgeFirewallFunctionsServices.listFunctionsService,
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
