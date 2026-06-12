<template>
  <LegacyBillingScreen
    v-if="experience === 'custom' || experience === 'internal'"
    ref="childRef"
    v-bind="serviceProps"
  />
  <TabsView
    v-else-if="experience !== 'null'"
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
  import { computed, ref, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'
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

  const emit = defineEmits(['loadCard', 'openDrawerAddCredit'])

  const accountStore = useAccountStore()
  const { billingExperience: experience } = storeToRefs(accountStore)
  const router = useRouter()

  const childRef = ref(null)

  const serviceProps = computed(() => ({
    loadPaymentMethodDefaultService: props.loadPaymentMethodDefaultService,
    getStripeClientService: props.getStripeClientService,
    loadCurrentInvoiceService: props.loadCurrentInvoiceService,
    loadInvoiceDataService: props.loadInvoiceDataService,
    listServiceAndProductsChangesService: props.listServiceAndProductsChangesService,
    documentPaymentMethodService: props.documentPaymentMethodService,
    listPaymentHistoryService: props.listPaymentHistoryService,
    documentPaymentHistoryService: props.documentPaymentHistoryService,
    loadYourServicePlanService: props.loadYourServicePlanService,
    openPlans: props.openPlans,
    loadContractServicePlan: props.loadContractServicePlan,
    loadInvoiceLastUpdatedService: props.loadInvoiceLastUpdatedService
  }))

  const callBackDrawer = async () => {
    await childRef.value?.callBackDrawer?.()
  }

  defineExpose({
    callBackDrawer
  })

  onMounted(() => {
    if (experience.value === 'null') {
      router.replace({ name: 'additional-data' })
    }
  })
</script>
