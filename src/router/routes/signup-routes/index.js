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
      meta: {
        hideNavigation: true
      },
      beforeEnter: (to, from, next) => {
        const accountStore = useAccountStore()

        if (accountStore.hasActiveUserId && accountStore.needsOnboarding) {
          const signupTypeFlags = accountStore.getSignupTypeFlags()
          const ssoMethod = accountStore.ssoSignUpMethod
          const isEmailSignup = signupTypeFlags.signup_email

          if (ssoMethod || isEmailSignup) {
            /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
            const tracker = inject('tracker')

            trackSignUpSafely({
              tracker,
              method: ssoMethod || 'email',
              signupTypeFlags,
              firstSessionUrl: getFirstSessionUrl()
            })
          }

          next()
        } else {
          next({ name: 'home' })
        }
      }
    }
  ]
}
