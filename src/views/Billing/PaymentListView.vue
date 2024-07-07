<template>
  <CreatePaymentMethodBlock
    :createService="props.createPaymentMethodService"
    v-if="showCreatePaymentMethodDrawer"
    v-model:visible="showCreatePaymentMethodDrawer"
  />
  <ListTable
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
          label="Add Credit"
          outlined
        />
        <PrimeButton
          icon="pi pi-plus"
          severity="secondary"
          @click="openDrawerCreatePaymentMethod"
          label="Add Payment Method"
        />
      </div>
    </template>
  </ListTable>
  <EmptyResultsBlock
    v-else
    title="No payment method has been added"
    description="Click the button below to add a payment method."
    createButtonLabel="Payment Method"
    :inTabs="true"
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
  import CreatePaymentMethodBlock from '@templates/add-payment-method-block'
  import ListTable from '@templates/list-table-block/action-column'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'

  import { ref } from 'vue'

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
    }
  })

  const showCreatePaymentMethodDrawer = ref(false)
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
      header: 'Expires in',
      sortField: 'expiringDateByOrder',
      filterPath: 'expiringDateSearch',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'credit-expiration-column' })
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
</script>
