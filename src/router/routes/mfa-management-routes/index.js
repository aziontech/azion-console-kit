import { listMfaUsersService, deleteMfaService } from '@/services/mfa-services/v4'

import * as Helpers from '@/helpers'

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
        deleteMfaService: deleteMfaService,
        documentationService: Helpers.documentationCatalog.mfaManagement
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
