import * as TemplateEngineService from '@/services/template-engine-services'
import * as MarketplaceService from '@/services/marketplace-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const createNewRoutes = {
  path: '/create',
  name: 'create',
  children: [
    {
      path: ':vendor/:solution',
      name: 'create-something-new',
      component: () => import('@views/CreateNew/CreateView.vue'),
      props: {
        getTemplateService: TemplateEngineService.getTemplate,
        getSolutionService: MarketplaceService.loadSolution,
        postTemplateService: TemplateEngineService.instantiateTemplate
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Create New',
            to: '/'
          }
        ]
      }
    }
  ]
}
