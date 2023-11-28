import * as MarketplaceService from '@/services/marketplace-services'
import { windowOpen } from '@/helpers/window-open'

/** @type {import('vue-router').RouteRecordRaw} */
export const marketplaceRoutes = {
  path: '/marketplace',
  name: 'marketplace',
  children: [
    {
      path: '',
      name: 'marketplace-home',
      component: () => import('@views/Marketplace/MarketplaceHomeView.vue'),
      props: {
        listCategoriesService: MarketplaceService.listCategoriesService,
        listSolutionsService: MarketplaceService.listSolutionsService
      }
    },
    {
      path: 'solution/:vendor/:solution',
      name: 'marketplace-solution',
      component: () => import('@views/Marketplace/SolutionView.vue'),
      props: {
        loadSolutionService: MarketplaceService.loadSolutionService,
        launchSolutionService: MarketplaceService.launchSolutionService,
        windowOpen
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Marketplace',
            to: '/marketplace'
          }
        ]
      }
    }
  ]
}
