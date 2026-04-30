import * as SignupService from '@/services/signup-services'
import { inject } from 'vue'
import { useAccountStore } from '@/stores/account'
import SignupView from '@/views/Signup/SignupView.vue'
import { getFirstSessionUrl } from '@/helpers/first-session-url'
import { trackSignUpSafely } from '@/helpers/track-auth-event'

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
        const signupTypeFlags = accountStore.getSignupTypeFlags()

        const isEmailSignup = signupTypeFlags.signup_email
        const isSsoSignup = accountStore.ssoSignUpMethod

        if (isFirstLogin && (isSsoSignup || isEmailSignup)) {
          /** @type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
          const tracker = inject('tracker')
          const method = isSsoSignup || 'email'

          trackSignUpSafely({
            tracker,
            method,
            signupTypeFlags,
            firstSessionUrl: getFirstSessionUrl()
          })
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
