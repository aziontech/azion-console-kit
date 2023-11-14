import * as SignupService from '@/services/signup-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const signupRoutes = {
  path: '/signup',
  name: '',
  children: [
    {
      path: '',
      name: 'signup',
      component: () => import('@views/Signup/SignupView.vue'),
      props: {
        signupService: SignupService.signupService
      },
      meta: {
        hideNavigation: true,
        isPublic: true
      }
    },
    {
      path: 'activation',
      name: 'activation',
      component: () => import('@views/Signup/SignupActivationView.vue'),
      props: {
        resendEmailService: SignupService.resendEmailService
      },
      meta: {
        hideNavigation: true,
        isPublic: true
      }
    },
    {
      path: 'additional-data',
      name: 'additional-data',
      component: () => import('@views/Signup/AdditionalDataView.vue'),
      props: {
        listAdditionalDataInfoService: SignupService.listAdditionalDataInfoService,
        listCountriesService: SignupService.listCountriesService,
        putAdditionalDataService: SignupService.putAdditionalDataService
      },
      meta: {
        hideNavigation: true,
        isPublic: true
      }
    }
  ]
}
