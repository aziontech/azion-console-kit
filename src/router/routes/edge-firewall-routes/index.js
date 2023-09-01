import * as EdgeFirewall from '@/services/edge-firewall-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeFirewallRoutes = {
  path: '/edge-firewall',
  name: 'edge-firewall',
  component: () => import('@views/EdgeFirewall/ListView.vue'),
  props: {
    listEdgeFirewallService: EdgeFirewall.listEdgeFirewallService,
    deleteEdgeFirewallService: EdgeFirewall.deleteEdgeFirewallService
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Edge Firewall',
        to: '/edge-firewall'
      }
    ]
  }
}
