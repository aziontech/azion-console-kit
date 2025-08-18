import * as AuthServices from '@/services/auth-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const passwordRoutes = {
  path: '/password',
  name: 'new-password',
  children: [
    {
      path: 'new/:uidb64/:token?',
      name: 'reset-password',
      component: () => import('@views/NewPassword/NewPasswordView.vue'),
      props: {
        resetPasswordService: AuthServices.resetPasswordService,
        passwordSettingService: AuthServices.passwordSettingService
      },
      meta: {
        title: 'New Password',
        isPublic: true,
        hideNavigation: true
      }
    }
  ]
}
