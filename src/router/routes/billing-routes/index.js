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
          documentPaymentHistoryService: Helpers.documentationGuideProducts.paymentHistory,
          loadYourServicePlanService: BillingServices.loadYourServicePlanService,
          openPlans: Helpers.openShowMorePlan,
          loadContractServicePlan: ContractServices.loadContractServicePlan,
          loadBillingCurrentInvoiceService: BillingServices.loadBillingCurrentInvoiceService
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
        loadInvoiceDataService: BillingServices.loadInvoiceDataService,
        clipboardWrite
      }
    }
  ]
}
