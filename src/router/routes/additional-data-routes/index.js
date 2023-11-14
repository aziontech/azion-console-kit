import * as SignupServices from '@/services/signup-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const additionalDataRoutes = {
  path: '/additional-data',
  name: 'additional-data',
  component: () => import('@views/AdditionalData/AdditionalDataView.vue'),
  props: {
    listAdditionalDataInfoService: SignupServices.listAdditionalDataInfoService,
    listCountriesService: SignupServices.listCountriesService
  },
  meta: {
    hideNavigation: true
  }
}
