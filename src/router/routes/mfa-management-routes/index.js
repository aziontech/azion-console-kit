import { documentationAccountsProducts } from '@/helpers/azion-documentation-catalog'

export const mfaManagementRoutes = {
  path: '/mfa-management',
  name: 'mfa-management',
  children: [
    {
      path: '',
      name: 'list-mfa-management',
      component: () => import('@views/MFAManagement/ListView.vue'),
      props: {
        documentationService: documentationAccountsProducts.mfaManagement
      },
      meta: {
        title: 'MFA Management',
        breadCrumbs: [
          {
            label: 'MFA Management',
            to: '/mfa-management'
          }
        ]
      }
    }
  ]
}
