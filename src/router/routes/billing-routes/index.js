import * as BillingServices from '@/services/billing-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const billingRoutes = {
  path: '/billing/:tab?',
  name: 'billing',
  children: [
    {
      path: '',
      name: 'billing-tabs',
      component: () => import('@views/Billing/TabsView.vue'),
      props: {
        paymentServices: {
          listPaymentService: BillingServices.listPaymentService
        }
      },
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
