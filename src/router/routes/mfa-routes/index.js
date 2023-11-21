import * as MfaServices from '@/services/mfa-services'
import * as AuthServices from '@/services/auth-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const mfaRoutes = {
  path: '/mfa',
  name: 'mfa',
  children: [
    {
      path: 'setup',
      name: 'setup-mfa',
      component: () => import('@views/MultifactorAuthentication/QRCodeView.vue'),
      props: {
        generateQrCodeMfaService: MfaServices.generateQrCodeMfaService,
        validateMfaCodeService: MfaServices.validateMfaCodeService
      },
      meta: {
        isPublic: true,
        hideNavigation: true
      }
    },
    {
      path: 'authentication',
      name: 'authentication-mfa',
      component: () => import('@views/MultifactorAuthentication/AuthenticateView.vue'),
      props: {
        validateMfaCodeService: MfaServices.validateMfaCodeService,
        verifyAuthenticationService: AuthServices.verifyAuthenticationService,
        switchAccountService: AuthServices.switchAccountService
      },
      meta: {
        isPublic: true,
        hideNavigation: true
      }
    }
  ]
}
