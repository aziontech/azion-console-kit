<template>
  <LegacyBillingScreen
    v-if="experience === 'custom' || experience === 'internal'"
    ref="childRef"
    v-bind="props"
    @loadCard="emit('loadCard')"
    @openDrawerAddCredit="emit('openDrawerAddCredit')"
    @openDrawerAddPaymentMethod="emit('openDrawerAddPaymentMethod')"
  >
    <template #notification="slotProp">
      <slot
        name="notification"
        v-bind="slotProp"
      />
    </template>
  </LegacyBillingScreen>
  <TabsView
    v-else
    ref="childRef"
    v-bind="props"
    @loadCard="emit('loadCard')"
    @openDrawerAddCredit="emit('openDrawerAddCredit')"
  >
    <template #notification="slotProp">
      <slot
        name="notification"
        v-bind="slotProp"
      />
    </template>
  </TabsView>
</template>

<script setup>
  import { ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useAccountStore } from '@/stores/account'
  import TabsView from '@/views/Billing/TabsView.vue'
  import LegacyBillingScreen from '@/views/Billing/legacy/LegacyBillingScreen.vue'

  defineOptions({ name: 'BillingScreen' })

  const props = defineProps({
    loadPaymentMethodDefaultService: { type: Function, required: true },
    getStripeClientService: { type: Function, required: true },
    loadCurrentInvoiceService: { type: Function, required: true },
    loadInvoiceDataService: { type: Function, required: true },
    listServiceAndProductsChangesService: { type: Function, required: true },
    documentPaymentMethodService: { type: Function, required: true },
    listPaymentHistoryService: { type: Function, required: true },
    documentPaymentHistoryService: { type: Function, required: true },
    loadYourServicePlanService: { type: Function, required: true },
    openPlans: { type: Function, required: true },
    loadContractServicePlan: { type: Function, required: true },
    loadInvoiceLastUpdatedService: { type: Function, required: true },
    cardDefault: { type: Object, required: true }
  })

  const emit = defineEmits(['loadCard', 'openDrawerAddCredit', 'openDrawerAddPaymentMethod'])

  const accountStore = useAccountStore()
  const { billingExperience: experience } = storeToRefs(accountStore)

  const childRef = ref(null)

  const callBackDrawer = async () => {
    await childRef.value?.callBackDrawer?.()
  }

  defineExpose({
    callBackDrawer
  })
</script>
