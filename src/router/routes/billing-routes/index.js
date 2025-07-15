import * as BillingServices from '@/services/billing-services'
import * as ContractServices from '@/services/contract-services'

import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const billingRoutes = {
  path: '/billing',
  name: 'billing',
  component: () => import('@views/Billing/BillingLayout.vue'),
  props: {
    loadPaymentMethodDefaultService: BillingServices.loadPaymentMethodDefaultService,
    loadInvoiceDataService: BillingServices.loadInvoiceDataService,
    loadCurrentInvoiceService: BillingServices.loadCurrentInvoiceService,
    listServiceAndProductsChangesService: BillingServices.listServiceAndProductsChangesService,
    clipboardWrite: Helpers.clipboardWrite,
    getStripeClientService: BillingServices.getStripeClientService,
    documentPaymentMethodService: Helpers.documentationGuideProducts.paymentMethods,
    listPaymentHistoryService: BillingServices.listPaymentHistoryService,
    documentPaymentHistoryService: Helpers.documentationGuideProducts.paymentHistory,
    loadYourServicePlanService: BillingServices.loadYourServicePlanService,
    openPlans: Helpers.openShowMorePlan,
    loadContractServicePlan: ContractServices.loadContractServicePlan,
    loadInvoiceLastUpdatedService: BillingServices.loadInvoiceLastUpdatedService
  },
  children: [
    {
      path: ':tab?',
      name: 'billing-tabs',
      component: () => import('@views/Billing/TabsView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Billing',
            to: '/billing'
          }
        ]
      }
    },
    {
      path: 'invoice-details/:billId',
      name: 'billing-invoice-details',
      component: () => import('@views/Billing/InvoiceDetailsView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Billing',
            to: '/billing'
          },
          {
            label: 'Invoice Details'
          }
        ]
      }
    }
  ]
}
