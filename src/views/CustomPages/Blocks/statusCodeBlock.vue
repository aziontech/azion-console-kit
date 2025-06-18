<template>
  <DrawerBlock
    ref="drawerRef"
    @onSuccess="updateList"
  />
  <FormHorizontal
    :isDrawer="props.isDrawer"
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
        :actions="actionsRow"
        emptyListMessage="No status codes found."
      />
    </template>
  </FormHorizontal>
</template>

<script setup>
  import DrawerBlock from '@views/CustomPages/Drawer/drawerStatusCode.vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import ListTableBlock from '@templates/list-table-block'
  import { ref } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useField, useFieldArray } from 'vee-validate'

  const listStatusCodeRef = ref(null)
  const hasContentToList = ref(true)
  const drawerRef = ref(null)

  const { fields: pages } = useFieldArray('pages')
  const { value: pagesValue } = useField('pages')

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

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
      field: 'customStatusCode',
      header: 'Custom Status'
    },
    {
      field: 'ttl',
      header: 'Response TTL'
    }
  ]

  const actionsRow = ref([
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: async (item) => {
        // eslint-disable-next-line no-console
        console.log('item', item)
      }
    },
    {
      label: 'Set as default',
      icon: 'pi pi-download',
      type: 'action',
      commandAction: async (item) => {
        // eslint-disable-next-line no-console
        console.log('item', item)
      }
    }
  ])

  const listStatusCodeService = () => {
    return pagesValue.value
  }

  const updateList = (item) => {
    const idx = pages.value.findIndex((page) => page.value.code === item.code)
    if (idx !== -1) {
      pages.value[idx].value = { ...pages.value[idx].value, ...item }
    }
    if (listStatusCodeRef.value && listStatusCodeRef.value.reloadList) {
      listStatusCodeRef.value.reloadList()
    }
  }

  const openEditStatusCodeDrawer = (item) => {
    drawerRef.value.openEditDrawer(item)
  }
</script>
