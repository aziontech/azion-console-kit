import * as SignupService from '@/services/signup-services'
import { listSocialIdpsService } from '@/services/social-idps-services'
// import { inject } from 'vue'
// import { useAccountStore } from '@/stores/account'
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
        listSocialIdpsService: listSocialIdpsService,
        resendEmailService: SignupService.resendEmailService
      },
      meta: {
        hideNavigation: true,
        showDocumentButton: true,
        hideLinksFooter: true,
        isPublic: true
      }
    },
    {
      path: 'additional-data',
      name: 'additional-data',
      component: () => import('@views/Signup/AdditionalDataView.vue'),
      props: {
        listAdditionalDataInfoService: SignupService.listAdditionalDataInfoService,
        putAdditionalDataService: SignupService.putAdditionalDataService
      },
      meta: {
        hideNavigation: true
      }
      // beforeEnter: (__, ___, next) => {
      //   const accountStore = useAccountStore()
      //   const isFirstLogin = accountStore.isFirstLogin

      //   if (isFirstLogin && accountStore.ssoSignUpMethod) {
      //     /** @type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
      //     const tracker = inject('tracker')
      //     const signUpMethod = { method: accountStore.ssoSignUpMethod }

      //     tracker.signUp.userSignedUp(signUpMethod).signUp.userAuthorizedSso(signUpMethod)
      //   }

      //   if (isFirstLogin) {
      //     next()
      //   } else {
      //     next({ name: 'home' })
      //   }
      // }
    }
  ]
}
