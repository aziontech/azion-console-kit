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
      meta: {
        hideNavigation: true
      },
      beforeEnter: (to, from, next) => {
        const accountStore = useAccountStore()

        if (accountStore.hasActiveUserId && accountStore.needsOnboarding) {
          next()
        } else {
          next({ name: 'home' })
        }
      }
    }
  ]
}
