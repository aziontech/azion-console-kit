export const credentialsRoutes = {
  path: '/credentials',
  name: 'credentials',
  meta: {
    title: 'Credentials'
  },
  children: [
    {
      path: ':tab?',
      name: 'credentials-tabs',
      component: () => import('@/views/Credentials/TabsView.vue'),
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
