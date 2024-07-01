<template>
  <ListTableNoHeaderBlock
    v-if="hasContentToList"
    :columns="paymentsColumns"
    :listService="props.listPaymentService"
    @on-load-data="handleLoadData"
    emptyListMessage="No payment method found."
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Add Credit"
      />
      <PrimeButton
        icon="pi pi-plus"
        label="Add Payment Method"
      />
    </template>
  </ListTableNoHeaderBlock>
</template>

<script setup>
  // import Illustration from '@/assets/svg/illustration-layers.vue'
  // import EmptyResultsBlock from '@/templates/empty-results-block'
  // import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'

  import { ref } from 'vue'

  const hasContentToList = ref(true)

  const props = defineProps({
    listPaymentService: {
      type: Function,
      required: true
    }
  })

  const paymentsColumns = ref([
    {
      field: 'cardData',
      header: 'Card Number',
      filterPath: 'cardData.value',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
    },
    {
      field: 'cardHolder',
      header: 'Card Holder'
    },
    {
      field: 'cardExpiration',
      header: 'Expires in',
      filterPath: 'cardExpiration.value',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>
