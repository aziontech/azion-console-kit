import * as MarketplaceService from '@/services/marketplace-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const marketplaceRoutes = {
  path: '/marketplace',
  name: 'marketplace',
  component: () => import('@views/Marketplace/MarketplaceHomeView.vue'),
  props: {
    listCategoriesService: MarketplaceService.listCategoriesService,
    listSolutionsService: MarketplaceService.listSolutionsService
  }
}
