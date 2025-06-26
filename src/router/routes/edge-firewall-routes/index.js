import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'

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
        listDomainsService: DomainServices.listDomainsService
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
          documentationService: Helpers.documentationCatalog.edgeFirewall,
          updatedRedirect: 'list-edge-firewall'
        },
        rulesEngineServices: {
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
