<script setup>
  import ListTableBlock from '@templates/list-table-block/index'
  import { computed, onBeforeUnmount } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const props = defineProps({
    data: {
      type: Object,
      required: true
    }
  })

  let listDataTimeout = null
  const getColumns = computed(() => {
    return [
      {
        field: 'order',
        header: 'Order'
      },
      {
        field: 'country',
        header: 'Country',
        type: 'component',
        filterPath: 'country.country',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'country-flag-column'
          })
        }
      },
      {
        field: 'ipsRange',
        header: 'IPs Range'
      },
      {
        field: 'blockedRequests',
        header: 'Blocked Requests'
      },
      {
        field: 'blockedBandwidth',
        header: 'Blocked Bandwidth'
      }
    ]
  })

  const fakeListDataWithTimoutDelay = () => {
    return new Promise((resolve) => {
      listDataTimeout = setTimeout(() => {
        resolve(props.data)
      }, 1000)
    })
  }

  onBeforeUnmount(() => {
    clearTimeout(listDataTimeout)
  })
</script>

<template>
  <div class="w-full h-full overflow-scroll overscroll-contain">
    <ListTableBlock
      :listService="fakeListDataWithTimoutDelay"
      :columns="getColumns"
    />
  </div>
</template>
