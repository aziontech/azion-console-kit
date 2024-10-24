/** @type {import('vue-router').RouteRecordRaw} */
export const identityProvidersRoutes = {
  path: '/identity-providers',
  name: 'identity-providers',
  children: [
    {
      path: '',
      name: 'identity-providers',
      component: () => import('@views/IdentityProviders/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Identity Providers',
            to: '/identity-providers'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-identity-provider',
      component: () => import('@views/IdentityProviders/CreateView.vue'),
      props: {},
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
    }
  ]
}
