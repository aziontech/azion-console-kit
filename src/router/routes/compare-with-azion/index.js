import * as CompareWithAzionService from '@/services/compare-with-azion'

export const compareWithAzionRoutes = {
  path: '/compare-with-azion/test',
  name: 'test-compare-with-azion',
  component: () => import('@views/CompareWithAzion/CompareView.vue'),
  meta: {
    breadCrumbs: [
      {
        label: 'Compare with Azion',
        to: '/compare-with-azion/test'
      }
    ]
  },
  props: {
    testConsolidationService: CompareWithAzionService.testConsolidation,
    getTestById: CompareWithAzionService.getTestById,
    getAllTestsByClientId: CompareWithAzionService.getAllTestsByClientId,
    getResult: CompareWithAzionService.getResult,
    getResultFromWebpagetest: CompareWithAzionService.getResultFromWebpagetest
  }
}
 