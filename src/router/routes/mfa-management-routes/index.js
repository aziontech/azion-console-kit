import { listMfaUsersService, deleteMfaService } from '@/services/mfa-services/v4'

export const mfaManagementRoutes = {
  path: '/mfa-management',
  name: 'mfa-management',
  children: [
    {
      path: '',
      name: 'list-mfa-management',
      component: () => import('@views/MFAManagement/ListView.vue'),
      props: {
        listMfaUsersService: listMfaUsersService,
        deleteMfaService: deleteMfaService
      },
      meta: {
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
