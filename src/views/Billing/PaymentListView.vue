<template>
  <ListTable
    v-if="hasContentToList"
    :columns="paymentsColumns"
    :listService="props.listPaymentService"
    :deleteService="props.deletePaymentService"
    @on-load-data="handleLoadData"
    :rowActions="actionsRow"
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
    :documentationService="props.documentPaymentService"
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
  import ListTable from '@templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'

  import { ref } from 'vue'

  const hasContentToList = ref(true)
  const toast = useToast()

  const props = defineProps({
    listPaymentService: {
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
    documentPaymentService: {
      type: Function,
      required: true
    }
  })

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
      icon: 'pi pi-fw pi-check-circle',
      command: async (item) => {
        await setPaymentAsDefault(item)
      }
    }
  ])
</script>
