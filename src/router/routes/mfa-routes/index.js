import { generateQrCodeService, validateMfaCode } from '@/services/mfa-services'
import { verifyAuthenticationService, switchAccountService } from '@/services/auth-services'

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
        generateQrCodeService,
        validateMfaCode
      }
    },
    {
      path: 'authentication',
      name: 'authentication-mfa',
      component: () => import('@views/MultifactorAuthentication/AuthenticateView.vue'),
      props: { validateMfaCode, verifyAuthenticationService, switchAccountService }
    }
  ]
}
