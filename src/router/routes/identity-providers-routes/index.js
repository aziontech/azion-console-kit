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
    }
  ]
}
