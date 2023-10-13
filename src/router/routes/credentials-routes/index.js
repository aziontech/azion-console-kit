import * as CredentialServices from '@/services/credential-services'

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
        listCredentialsService: CredentialServices.listCredentialsService,
        deleteCredentialService: CredentialServices.deleteCredentialService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Credentials',
            to: '/credentials'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-credential',
      component: () => import('@views/Credentials/CreateView.vue'),
      props: {
        createCredentialService: CredentialServices.createCredentialService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Credentials',
            to: '/credentials'
          },
          {
            label: 'Create Credential',
            to: '/credential/create'
          }
        ]
      }
    }
  ]
}
