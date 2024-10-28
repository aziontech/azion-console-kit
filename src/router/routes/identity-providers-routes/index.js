import * as idpService from '@/services/identity-providers-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const identityProvidersRoutes = {
  path: '/identity-providers',
  name: 'identity-providers',
  children: [
    {
      path: '',
      name: 'list-identity-providers',
      component: () => import('@views/IdentityProviders/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Identity Providers',
            to: '/identity-providers'
          }
        ]
      },
      props: {
        listIdentityProvidersService: idpService.listIdentityProvidersService,
        deleteSAMLIdentityProviderService: idpService.deleteSAMLIdentityProviderService,
        deleteOIDCIdentityProviderService: idpService.deleteOIDCIdentityProviderService,
        setIdentityProviderStatusService: idpService.setIdentityProviderStatusService
      }
    },
    {
      path: 'create',
      name: 'create-identity-provider',
      component: () => import('@views/IdentityProviders/CreateView.vue'),
      props: {
        createOIDCIdentityProviderService: idpService.createOIDCIdentityProviderService,
        createSAMLIdentityProviderService: idpService.createSAMLIdentityProviderService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Identity Providers',
            to: '/identity-providers'
          },
          {
            label: 'Create Identity Provider',
            to: '/identity-providers/create'
          }
        ]
      }
    },
    {
      path: 'edit/:protocol/:id',
      name: 'edit-identity-providers',
      component: () => import('@views/IdentityProviders/EditView.vue'),
      props: {
        editOIDCIdentityProviderService: idpService.editOIDCIdentityProviderService,
        editSAMLIdentityProviderService: idpService.editSAMLIdentityProviderService,
        loadOIDCIdentityProviderService: idpService.loadOIDCIdentityProviderService,
        loadSAMLIdentityProviderService: idpService.loadSAMLIdentityProviderService,
        updatedRedirect: 'identity-providers'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Identity Providers',
            to: '/identity-providers'
          },
          {
            label: 'Edit Identity Provider'
          }
        ]
      }
    }
  ]
}
