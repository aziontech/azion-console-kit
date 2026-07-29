/** @type {import('vue-router').RouteRecordRaw} */
export const billingV4Routes = {
  path: '/billing',
  name: 'billing',
  component: () => import('@views/BillingV4/index.vue'),
  meta: {
    title: 'Billing',
    breadCrumbs: [
      {
        label: 'Billing',
        to: '/billing'
      }
    ]
  },
  children: [
    {
      path: 'payment',
      redirect: { name: 'billing' }
    },
    {
      path: ':tab?',
      name: 'billing-tabs',
      redirect: { name: 'billing' }
    }
  ]
}
