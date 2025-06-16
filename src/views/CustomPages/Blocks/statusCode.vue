<template>
  <FormHorizontal
    isDrawer
    title="Status Codes"
    description="Use the Status Codes table to configure error pages by editing HTTP status codes. Click a row to open the settings panel and customize values like Response TTL, Custom Status Code, and Page Path (URI)."
    :pt="classesPt"
  >
    <template #inputs>
      <ListTableBlock
        v-if="hasContentToList"
        ref="listStatusCodeRef"
        isTabs
        :enableEditClick="false"
        :columns="loaderStatusCodeColumns"
        :editInDrawer="openEditStatusCodeDrawer"
        :listService="listStatusCodeService"
        @on-load-data="handleLoadData"
        @on-before-go-to-edit="goToEnvoiceDetails"
        :actions="actionsRow"
        emptyListMessage="No status codes found."
      />
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import ListTableBlock from '@templates/list-table-block'
  import { ref, computed } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { STATUS_CODE_OPTIONS } from '@/views/CustomPages/Config/statusCode'

  const listStatusCodeRef = ref(null)
  const hasContentToList = ref(true)

  const openEditStatusCodeDrawer = (item) => {
    console.log('openEditStatusCodeDrawer', item)
  }

  const classesPt = {
    root: 'flex-col',
    description: 'max-w-md',
    content: 'max-w-full'
  }

  const loaderStatusCodeColumns = [
    {
      field: 'code',
      header: 'Code',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: {
            content: columnData,
            severity: 'danger'
          },
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'type',
      header: 'Type',
      sortField: 'type',
      filterPath: 'type',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: {
            content: columnData,
            severity: columnData === 'Default' ? 'info' : ''
          },
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'customStatus',
      header: 'Custom Status'
    },
    {
      field: 'responseTTL',
      header: 'Response TTL'
    }
  ]

  const handleLoadData = () => {
    console.log('handleLoadData')
  }

  const goToEnvoiceDetails = () => {
    console.log('goToEnvoiceDetails')
  }

  const actionsRow = ref([
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: async (item) => {
        console.log('item', item)
      }
    },
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: async (item) => {
        console.log('item', item)
      }
    }
  ])

  const listStatusCodeService = () => {
    return STATUS_CODE_OPTIONS
  }
</script>
