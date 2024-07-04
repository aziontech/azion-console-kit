<template>
  <h2 class="text-lg font-medium line-height-1 mt-4">Payment History</h2>
  <ListTable
    v-if="hasContentToList"
    isTabs
    :enableEditClick="false"
    :columns="paymentsColumns"
    :listService="props.listPaymentHistoryService"
    @on-load-data="handleLoadData"
    :actions="actionsRow"
    emptyListMessage="No payment history found."
  />
  <EmptyResultsBlock
    v-else
    title="No payment history has been added"
    description="No payment history is available at the moment. Please check back later."
    :inTabs="true"
    :documentationService="props.documentPaymentHistoryService"
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
  import ListTable from '@templates/list-table-block/action-column'

  import { ref } from 'vue'

  const hasContentToList = ref(true)

  const props = defineProps({
    listPaymentHistoryService: {
      type: Function,
      required: true
    },
    documentPaymentHistoryService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const paymentsColumns = ref([
    {
      field: 'paymentDate',
      header: 'Payment Date'
    },
    {
      field: 'invoiceNumber',
      header: 'invoice ID',
      filterPath: 'invoiceNumber.content',
      sortField: 'invoiceNumber.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-full-with-clipboard',
          dependencies: {
            copyContentService: props.clipboardWrite
          }
        })
      }
    },
    {
      field: 'paymentMethod',
      header: 'Payment Method',
      filterPath: 'paymentMethod.value',
      sortField: 'paymentMethod.value',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
    },
    {
      field: 'amount',
      header: 'Transactions Amount'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'component',
      sortField: 'status.content',
      filterPath: 'status.content',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const actionsRow = ref([
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: async (item) => {
        if (item.invoiceUrl) window.open(item.invoiceUrl, '_blank')
      }
    }
  ])
</script>
