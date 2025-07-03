import { ref, provide, inject } from 'vue'

const BILLING_DRAWERS_INJECTION_KEY = Symbol('billing-drawers')

export function provideBillingDrawers() {
  const drawerAddCreditRef = ref(null)
  const drawerPaymentMethodRef = ref(null)

  const openDrawerAddCredit = () => {
    if (drawerAddCreditRef.value) {
      drawerAddCreditRef.value.openDrawer()
    }
  }

  const openDrawerPaymentMethod = () => {
    if (drawerPaymentMethodRef.value) {
      drawerPaymentMethodRef.value.openDrawer()
    }

  }

  const billingDrawers = {
    drawerAddCreditRef,
    drawerPaymentMethodRef,
    openDrawerAddCredit,
    openDrawerPaymentMethod
  }

  provide(BILLING_DRAWERS_INJECTION_KEY, billingDrawers)

  return billingDrawers
}

export function useBillingDrawers() {
  const billingDrawers = inject(BILLING_DRAWERS_INJECTION_KEY)
  
  if (!billingDrawers) {
    throw new Error('useBillingDrawers must be used within a component that calls provideBillingDrawers')
  }

  return billingDrawers
} 