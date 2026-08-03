import * as Helpers from '@/helpers'
import * as DomainServices from '@/services/domains-services'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

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
        documentationService: documentationSecureProducts.firewall
      },
      meta: {
        title: 'Firewall',
        breadCrumbs: [
          {
            label: 'Firewalls',
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
            label: 'Firewalls',
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
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/EdgeFirewall/v6/EditView.vue')
          : import('@/views/EdgeFirewall/TabsView.vue'),
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
            label: 'Firewalls',
            to: '/firewalls'
          },
          {
            label: 'Edit Firewall',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-firewall', params: ['id'] }
          }
        ]
      }
    },
    {
      path: 'edit/:id/versions/:versionId/:tab?',
      name: 'edit-firewall-version',
      component: () => import('@views/EdgeFirewall/v6/VersionEditView.vue'),
      props: () => ({
        listDomainsService: DomainServices.listDomainsService
      }),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Firewalls',
            to: '/firewalls'
          },
          {
            label: 'Edit Firewall',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-firewall', params: ['id'] }
          },
          {
            label: 'Version',
            dynamic: true,
            routeParam: 'versionId',
            useParamValue: true
          }
        ]
      }
    }
  ]
}
