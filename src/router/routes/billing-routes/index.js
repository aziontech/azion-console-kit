/** @type {import('vue-router').RouteRecordRaw} */
export const billingRoutes = {
  path: '/billing/:tab?',
  name: 'billing',
  children: [
    {
      path: '',
      name: 'billing-tabs',
      component: () => import('@views/Billing/TabsView.vue'),
      props: {},
      meta: {
        breadCrumbs: [
          {
            label: 'Billing',
            to: '/billing'
          }
        ]
      }
    }
  ]
}
