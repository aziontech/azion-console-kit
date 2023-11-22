/** @type {import('vue-router').RouteRecordRaw} */
export const marketplaceRoutes = {
  path: '/marketplace',
  name: 'marketplace',
  component: () => import('@views/Marketplace/MarketplaceHomeView.vue'),
  props: {},
  meta: {
    isPublic: true,
    hideNavigation: true
  }
}
