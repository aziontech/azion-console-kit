import * as BillingServices from '@/services/billing-services'
import * as ContractServices from '@/services/contract-services'
import { clipboardWrite } from '@/helpers/clipboard'

import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const billingRoutes = {
  path: '/billing',
  name: 'billing',
  meta: {
    routeForBlock: '/billing/payment'
  },
  children: [
    {
      path: ':tab?',
      name: 'billing-tabs',
      component: () => import('@views/Billing/TabsView.vue'),
      props: {
        loadPaymentMethodDefaultService: BillingServices.loadPaymentMethodDefaultService,
        addCreditService: BillingServices.addCreditService,
        createPaymentMethodService: BillingServices.createPaymentMethodService,
        loadInvoiceLastUpdatedService: BillingServices.loadInvoiceLastUpdatedService,
        paymentServices: {
          listPaymentMethodsService: BillingServices.listPaymentMethodsService,
          deletePaymentService: BillingServices.deletePaymentService,
          setAsDefaultPaymentService: BillingServices.setAsDefaultPaymentService,
          documentPaymentMethodService: Helpers.documentationGuideProducts.paymentMethods
        },
        billsServices: {
          listPaymentHistoryService: BillingServices.listPaymentHistoryService,
          clipboardWrite: Helpers.clipboardWrite,
          documentPaymentHistoryService: Helpers.documentationGuideProducts.paymentHistory,
          loadYourServicePlanService: BillingServices.loadYourServicePlanService,
          openPlans: Helpers.openShowMorePlan,
          loadContractServicePlan: ContractServices.loadContractServicePlan,
          loadCurrentInvoiceService: BillingServices.loadCurrentInvoiceService
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
        listServiceAndProductsAccountChangesService:
          BillingServices.listServiceAndProductsAccountChangesService,
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
