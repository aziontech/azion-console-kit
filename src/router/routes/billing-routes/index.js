import * as BillingServices from '@/services/billing-services'
import * as Helpers from '@/helpers'

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
          listPaymentService: BillingServices.listPaymentService,
          deletePaymentService: BillingServices.deletePaymentService,
          setAsDefaultPaymentService: BillingServices.setAsDefaultPaymentService,
          documentPaymentService: Helpers.documentationCatalog.paymentMethods,
          createPaymentMethodService: BillingServices.createCreditCardService,
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
