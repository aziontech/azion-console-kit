export const mfaManagementRoutes = {
  path: '/mfa-management',
  name: 'mfa-management',
  children: [
    {
      path: '',
      name: 'list-mfa-management',
      component: () => import('@views/MFAManagement/ListView.vue'),
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
