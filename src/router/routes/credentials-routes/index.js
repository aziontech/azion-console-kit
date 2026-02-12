import { documentationCatalog } from '@/helpers/azion-documentation-catalog'

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
      props: {
        documentationService: documentationCatalog.credentials
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
