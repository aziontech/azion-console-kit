/** @type {import('vue-router').RouteRecordRaw} */
import * as ContractServices from '@/services/contract-services'

export const azionAiRoutes = {
  path: '/copilot',
  name: 'copilot',
  component: () => import('@views/Copilot/index.vue'),
  props: {
    loadContractServicePlan: ContractServices.loadContractServicePlan
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Copilot',
        to: '/copilot'
      }
    ]
  }
}
