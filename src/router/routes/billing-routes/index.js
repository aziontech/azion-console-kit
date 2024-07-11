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
          listPaymentMethodsService: BillingServices.listPaymentMethodsService,
          deletePaymentService: BillingServices.deletePaymentService,
          setAsDefaultPaymentService: BillingServices.setAsDefaultPaymentService,
          createPaymentMethodService: BillingServices.createPaymentMethodService,
          documentPaymentMethodService: Helpers.documentationGuideProducts.paymentMethods,
          addCreditService: BillingServices.addCreditService
        },
        billsServices: {
          listPaymentHistoryService: BillingServices.listPaymentHistoryService,
          clipboardWrite: Helpers.clipboardWrite,
          documentPaymentHistoryService: Helpers.documentationGuideProducts.paymentHistory
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
