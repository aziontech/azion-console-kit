import * as SignupService from '@/services/signup-services'
import { listSocialIdpsService } from '@/services/social-idps-services'
import { useAccountStore } from '@/stores/account'
import SignupView from '@/views/Signup/SignupView.vue'

/** @type {import('vue-router').RouteRecordRaw} */
export const signupRoutes = {
  path: '/signup',
  name: '',
  children: [
    {
      path: '',
      name: 'signup',
      component: SignupView,
      props: {
        signupService: SignupService.signupService,
        listSocialIdpsService: listSocialIdpsService
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
        hideNavigation: true
      },
      beforeEnter: (_, __, next) => {
        const accountStore = useAccountStore()
        if (accountStore.isFirstLogin) {
          next()
        } else {
          next({ name: 'home' })
        }
      }
    }
  ]
}
