import * as SignupService from '@/services/signup-services'
import { inject } from 'vue'
import { useAccountStore } from '@/stores/account'
import SignupView from '@/views/Signup/SignupView.vue'
import { getFirstSessionUrl } from '@/helpers/first-session-url'

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
        postAdditionalDataService: SignupService.postAdditionalDataService,
        patchFullnameService: SignupService.patchFullnameService,
        updateAccountInfoService: SignupService.updateAccountInfoService
      },
      meta: {
        hideNavigation: true
      },
      beforeEnter: (__, ___, next) => {
        const accountStore = useAccountStore()
        const isFirstLogin = accountStore.isFirstLogin

        if (isFirstLogin && accountStore.ssoSignUpMethod) {
          /** @type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
          const tracker = inject('tracker')
          const method = accountStore.ssoSignUpMethod

          // Set the appropriate signup flag
          const signupFlag = `signup_sso_${method}`
          accountStore.setSignupTypeFlag(signupFlag)

          const signUpPayload = {
            method,
            firstSessionUrl: getFirstSessionUrl(),
            signupType: 'sso',
            signupTypeFlags: accountStore.getSignupTypeFlags()
          }

          tracker.signUp.userSignedUp(signUpPayload).signUp.userAuthorizedSso(signUpPayload)
        }

        if (isFirstLogin) {
          next()
        } else {
          next({ name: 'home' })
        }
      }
    }
  ]
}
