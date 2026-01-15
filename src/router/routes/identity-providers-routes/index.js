import * as idpService from '@/services/identity-providers-services'
import { useAccountStore } from '@/stores/account'
import { documentationGuideProducts } from '@/helpers/azion-documentation-catalog'

function checkSSOAccess(to, from, next) {
  const accountStore = useAccountStore()

  if (!accountStore.hasAccessToSSOManagement) {
    return next('/')
  }

  return next()
}

/** @type {import('vue-router').RouteRecordRaw} */
export const identityProvidersRoutes = {
  path: '/identity-providers',
  name: 'identity-providers',
  children: [
    {
      path: '',
      name: 'list-identity-providers',
      component: () => import('@views/IdentityProviders/ListView.vue'),
      beforeEnter: checkSSOAccess,
      meta: {
        title: 'SSO Management',
        breadCrumbs: [
          {
            label: 'Identity Providers',
            to: '/identity-providers'
          }
        ]
      },
      props: {
        documentationService: documentationGuideProducts.sso,
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
      beforeEnter: checkSSOAccess,
      props: {
        createOIDCIdentityProviderService: idpService.createOIDCIdentityProviderService,
        createSAMLIdentityProviderService: idpService.createSAMLIdentityProviderService
      },
      meta: {
        title: 'Create Identity Provider',
        breadCrumbs: [
          {
            label: 'Identity Provider',
            to: '/identity-providers'
          },
          {
            label: 'Create',
            to: '/identity-providers/create'
          }
        ]
      }
    },
    {
      path: 'edit/:protocol/:id',
      name: 'edit-identity-providers',
      component: () => import('@views/IdentityProviders/EditView.vue'),
      beforeEnter: checkSSOAccess,
      props: {
        editOIDCIdentityProviderService: idpService.editOIDCIdentityProviderService,
        editSAMLIdentityProviderService: idpService.editSAMLIdentityProviderService,
        loadOIDCIdentityProviderService: idpService.loadOIDCIdentityProviderService,
        loadSAMLIdentityProviderService: idpService.loadSAMLIdentityProviderService,
        updatedRedirect: 'list-identity-providers'
      },
      meta: {
        title: 'Edit Identity Provider',
        breadCrumbs: [
          {
            label: 'Identity Provider',
            to: '/identity-providers'
          },
          {
            label: 'Edit Identity Provider',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
