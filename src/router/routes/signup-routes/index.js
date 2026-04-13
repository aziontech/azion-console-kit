import * as SignupService from '@/services/signup-services'
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
      beforeEnter: (to, from, next) => {
        const accountStore = useAccountStore()

        // Only allow access to additional-data if:
        // 1. User has active session (hasActiveUserId)
        // 2. hasServiceOrderPlan === false (needs to complete service order)
        if (accountStore.hasActiveUserId && accountStore.hasServiceOrderPlan === false) {
          next()
        } else {
          // If user doesn't need service order, redirect to home
          next({ name: 'home' })
        }
      }
    }
  ]
}
