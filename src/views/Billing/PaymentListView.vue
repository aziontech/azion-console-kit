<template>
  <ListTableBlock
    ref="listPaymentMethodsRef"
    v-if="hasContentToList"
    :enableEditClick="false"
    isTabs
    :columns="paymentsColumns"
    :listService="props.listPaymentMethodsService"
    @on-load-data="handleLoadData"
    :actions="actionsRow"
    emptyListMessage="No payment method found."
  >
    <template #addButton>
      <div class="flex gap-4">
        <PrimeButton
          icon="pi pi-plus"
          label="Credit"
          @click="drawersMethods.openDrawerAddCredit"
          data-testid="payment-methods__add-credit__button"
          outlined
        />
        <PrimeButton
          icon="pi pi-plus"
          data-testid="payment-methods__add-payment-method__button"
          severity="secondary"
          @click="drawersMethods.openDrawerPaymentMethod"
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
    @click="openDrawerCreatePaymentMethod"
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
  import ListTableBlock from '@templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'

  import { ref, inject } from 'vue'

  const hasContentToList = ref(true)
  const toast = useToast()

  const props = defineProps({
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
    }
  })

  const listPaymentMethodsRef = ref('')

  const drawersMethods = inject('drawersMethods')

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

  const reloadList = () => {
    if (hasContentToList.value) {
      listPaymentMethodsRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  defineExpose({
    reloadList
  })
</script>
