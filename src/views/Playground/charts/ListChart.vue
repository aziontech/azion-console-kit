<script setup>
  import ListTableBlock from '@templates/list-table-block/index'
  import { COUNTRY_IP_BLOCK_BANDWIDTH_LIST_DATA } from './constants/data.js'
  import { computed, onBeforeUnmount } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

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
        resolve(COUNTRY_IP_BLOCK_BANDWIDTH_LIST_DATA.data)
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
