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
        public: true
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
        public: true
      }
    }
  ]
}
