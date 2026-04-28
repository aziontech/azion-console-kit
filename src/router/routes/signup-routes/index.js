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
        const signupTypeFlags = accountStore.getSignupTypeFlags()

        // Check if this is a first login with signup tracking needed
        const isEmailSignup = signupTypeFlags.signup_email
        const isSsoSignup = accountStore.ssoSignUpMethod

        if (isFirstLogin && (isSsoSignup || isEmailSignup)) {
          /** @type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
          const tracker = inject('tracker')

          // Determine the method for tracking
          const method = isSsoSignup || 'email'

          // Get user data for HubSpot tracking
          const { userId: consoleUserId, accountData } = accountStore
          const userEmail = accountData?.email
          const userName = accountData?.name || ''
          const companyName = accountData?.company_name || ''

          // Parse first and last name from full name
          const nameParts = userName.split(' ')
          const firstname = nameParts[0] || ''
          const lastname = nameParts.slice(1).join(' ') || ''

          const signUpPayload = {
            method,
            firstSessionUrl: getFirstSessionUrl(),
            signupTypeFlags,
            // HubSpot required fields
            email: userEmail,
            userId: consoleUserId,
            firstname,
            lastname,
            company: companyName,
            githubHandle: method === 'github' ? accountData?.github_handle : undefined
          }

          // Track user signup with Segment and HubSpot
          tracker.signUp.userSignedUp(signUpPayload)

          // For SSO, also track the SSO authorization event
          if (isSsoSignup) {
            tracker.signUp.userAuthorizedSso(signUpPayload)
          }
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
