import {
  listCredentialsService,
  deleteCredentialService,
  createCredentialService,
  loadCredentialService,
  editCredentialService
} from '@/services/credential-services'

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
    },
    {
      path: 'create',
      name: 'create-credential',
      component: () => import('@views/Credentials/CreateView.vue'),
      props: {
        createCredentialService
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
    },
    {
      path: 'edit/:id',
      name: 'edit-credential',
      component: () => import('@views/Credentials/EditView.vue'),
      props: {
        editCredentialService,
        loadCredentialService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Credentials',
            to: '/credentials'
          },
          {
            label: 'Edit Credential'
          }
        ]
      }
    }
  ]
}
