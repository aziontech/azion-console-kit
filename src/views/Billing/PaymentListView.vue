<template>
  <Drawer
    ref="drawerRef"
    :cardDefault="cardDefault"
    :createService="props.addCreditService"
  />

  <CreatePaymentMethodBlock
    :createService="props.createPaymentMethodService"
    v-model:visible="showCreatePaymentMethodDrawer"
    v-if="loadCreatePaymentMethodDrawer"
    @onSuccess="reloadList"
  />
  <ListTableBlock
    ref="listPaymentMethodsRef"
    v-if="hasContentToList"
    :enableEditClick="false"
    isTabs
    :columns="paymentsColumns"
    :listService="listPaymentMethodsServiceWithDecorator"
    @on-load-data="handleLoadData"
    :actions="actionsRow"
    emptyListMessage="No payment method found."
  >
    <template #addButton>
      <div class="flex gap-4">
        <PrimeButton
          icon="pi pi-plus"
          label="Credit"
          @click="openCreateCreditDrawer"
          outlined
        />
        <PrimeButton
          icon="pi pi-plus"
          severity="secondary"
          @click="openDrawerCreatePaymentMethod"
          label="Payment Method"
        />
      </div>
    </template>
  </ListTableBlock>
  <EmptyResultsBlock
    v-else
    title="No payment method has been added"
    description="Click the button below to add a payment method."
    createButtonLabel="Payment Method"
    inTabs
    :documentationService="props.documentPaymentMethodService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { refDebounced } from '@vueuse/core'
  import CreatePaymentMethodBlock from '@templates/add-payment-method-block'
  import ListTableBlock from '@templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  import Drawer from './Drawer'

  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  const hasContentToList = ref(true)
  const toast = useToast()

  const props = defineProps({
    createPaymentMethodService: {
      type: Function,
      required: true
    },
    listPaymentMethodsService: {
      type: Function,
      required: true
    },
    deletePaymentService: {
      type: Function,
      required: true
    },
    setAsDefaultPaymentService: {
      type: Function,
      required: true
    },
    documentPaymentMethodService: {
      type: Function,
      required: true
    },
    addCreditService: {
      type: Function,
      required: true
    }
  })

  const drawerRef = ref('')
  const route = useRoute()
  const router = useRouter()
  const cardDefault = ref({})
  const listPaymentMethodsRef = ref('')
  const showCreatePaymentMethodDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreatePaymentMethodDrawer = refDebounced(
    showCreatePaymentMethodDrawer,
    debouncedDrawerAnimate
  )

  const paymentsColumns = ref([
    {
      field: 'cardData',
      header: 'Card Number',
      filterPath: 'cardNumberSearch',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
    },
    {
      field: 'cardHolder',
      header: 'Card Holder',
      sortField: 'cardHolder'
    },
    {
      field: 'cardExpiration',
      header: 'Expiration Date',
      sortField: 'expiringDateByOrder',
      filterPath: 'expiringDateSearch',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'text-with-tag' })
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const openDrawerCreatePaymentMethod = () => {
    showCreatePaymentMethodDrawer.value = true
  }

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    toast.add(options)
  }

  const setPaymentAsDefault = async (payment) => {
    try {
      const feedback = await props.setAsDefaultPaymentService(payment.id)
      showToast('success', feedback)
    } catch (error) {
      showToast('error', error)
    }
  }

  const actionsRow = ref([
    {
      label: 'Set as default',
      type: 'action',
      icon: 'pi pi-fw pi-check-circle',
      commandAction: async (item) => {
        await setPaymentAsDefault(item)
      }
    },
    {
      label: 'Delete',
      type: 'delete',
      title: 'Payment Method',
      service: props.deletePaymentService
    }
  ])

  const listPaymentMethodsServiceWithDecorator = async () => {
    const listPaymentMethods = await props.listPaymentMethodsService()
    const [firstCard] = listPaymentMethods
    cardDefault.value = firstCard
    return listPaymentMethods
  }

  const openCreateCreditDrawer = () => {
    if (cardDefault.value.isDefault) drawerRef.value.openCreateDrawer()
  }

  const reloadList = () => {
    if (hasContentToList.value) {
      listPaymentMethodsRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const showPaymentMethod = () => {
    if (route.query.paymentSession) {
      openDrawerCreatePaymentMethod()
      router.push({ query: {} })
    }
  }

  onMounted(async () => {
    showPaymentMethod()
  })
</script>
