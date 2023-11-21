import * as MfaServices from '@/services/mfa-services'
import * as AuthServices from '@/services/auth-services'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { switchAccountService } from '@/services/auth-services/switch-account-service'
import { AccountHandler } from '@/helpers/handle-switch-account'

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
        validateMfaCodeService: MfaServices.validateMfaCodeService,
        verifyAuthenticationService: AuthServices.verifyAuthenticationService,
        accountHandler: new AccountHandler(switchAccountService, listTypeAccountService)
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
        accountHandler: new AccountHandler(switchAccountService, listTypeAccountService)
      },
      meta: {
        isPublic: true,
        hideNavigation: true
      }
    }
  ]
}
