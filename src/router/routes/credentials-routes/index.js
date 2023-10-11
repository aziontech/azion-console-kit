import { listCredentialsService, deleteCredentialService } from '@/services/credential-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const credentialsRoutes = {
  path: '/credentials',
  name: 'credentials',
  children: [
    {
      path: '',
      name: 'list-credentials',
      component: () => import('@views/Credentials/ListView.vue'),
      props: {
        listCredentialsService,
        deleteCredentialService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Credentials',
            to: '/credentials'
          }
        ]
      }
    }
  ]
}
