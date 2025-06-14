import * as BillingServices from '@/services/billing-services'
import * as ContractServices from '@/services/contract-services'
import { clipboardWrite } from '@/helpers/clipboard'

import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const billingRoutes = {
  path: '/billing',
  name: 'billing',
  children: [
    {
      path: ':tab?',
      name: 'billing-tabs',
      component: () => import('@views/Billing/TabsView.vue'),
      props: {
        loadPaymentMethodDefaultService: BillingServices.loadPaymentMethodDefaultService,
        getStripeClientService: BillingServices.getStripeClientService,
        paymentServices: {
          documentPaymentMethodService: Helpers.documentationGuideProducts.paymentMethods
        },
        billsServices: {
          listPaymentHistoryService: BillingServices.listPaymentHistoryService,
          clipboardWrite: Helpers.clipboardWrite,
          documentPaymentHistoryService: Helpers.documentationGuideProducts.paymentHistory,
          loadYourServicePlanService: BillingServices.loadYourServicePlanService,
          openPlans: Helpers.openShowMorePlan,
          loadContractServicePlan: ContractServices.loadContractServicePlan,
          loadCurrentInvoiceService: BillingServices.loadCurrentInvoiceService,
          loadInvoiceLastUpdatedService: BillingServices.loadInvoiceLastUpdatedService
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
    },
    {
      path: 'invoice-details/:billId',
      name: 'billing-invoice-details',
      component: () => import('@/views/Billing/InvoiceDetailsView.vue'),
      props: {
        loadPaymentMethodDefaultService: BillingServices.loadPaymentMethodDefaultService,
        loadInvoiceDataService: BillingServices.loadInvoiceDataService,
        listServiceAndProductsChangesService: BillingServices.listServiceAndProductsChangesService,
        clipboardWrite
      },
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
