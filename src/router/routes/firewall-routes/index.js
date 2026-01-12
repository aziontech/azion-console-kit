import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeFirewallRoutes = {
  path: '/firewalls',
  name: 'firewalls',
  children: [
    {
      path: '',
      name: 'list-firewalls',
      component: () => import('@views/EdgeFirewall/ListView.vue'),
      props: {
        documentationService: Helpers.documentationCatalog.edgeFirewall
      },
      meta: {
        title: 'Firewall',
        breadCrumbs: [
          {
            label: 'Firewall',
            to: '/firewalls'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-firewall',
      component: () => import('@views/EdgeFirewall/CreateView.vue'),
      props: {
        listDomainsService: DomainServices.listDomainsService
      },
      meta: {
        title: 'Create Firewall',
        breadCrumbs: [
          {
            label: 'Firewall',
            to: '/firewalls'
          },
          {
            label: 'Create',
            to: '/firewalls/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-firewall',
      component: () => import('@/views/EdgeFirewall/TabsView.vue'),
      props: {
        listDomainsService: DomainServices.listDomainsService,
        edgeFirewallServices: {
          documentationService: Helpers.documentationCatalog.edgeFirewall,
          updatedRedirect: 'list-firewalls'
        },
        rulesEngineServices: {
          documentationService: Helpers.documentationCatalog.edgeFirewallRulesEngine
        }
      },
      meta: {
        title: 'Edit Firewall',
        breadCrumbs: [
          {
            label: 'Firewall',
            to: '/firewalls'
          },
          {
            label: 'Edit Firewall',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
