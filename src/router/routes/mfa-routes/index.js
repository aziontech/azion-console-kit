import { generateQrCodeService } from '@/services/mfa-services/generate-qrcode-mfa-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const mfaRoutes = {
  path: '/mfa',
  name: 'mfa',
  children: [
    {
      path: 'setup',
      name: 'setup-mfa',
      component: () => import('@views/MultifactorAuthentication/QRCodeView.vue'),
      props: {generateQrCodeService},
    },
    {
      path: 'authentication',
      name: 'authentication-mfa',
      component: () => import('@views/MultifactorAuthentication/AuthenticateView.vue'),
      props: {

      },
    },
  ]
}
