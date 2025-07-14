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
      >
        <template #addButton>
          <PrimeButton
            icon="pi pi-plus"
            label="Add Status Code"
            data-testid="status-code__add-button"
            @click="openEditStatusCodeDrawer"
            class="w-full sm:w-auto"
          />
        </template>
      </ListTableBlock>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import DrawerBlock from '@/views/CustomPages/Drawer/drawerSelectStatusCode'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import ListTableBlock from '@templates/list-table-block'
  import { ref, computed } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useField, useFieldArray } from 'vee-validate'
  import { STATUS_CODE_OPTIONS } from '@/views/CustomPages/ConfigForm/listStatusCode'

  const listStatusCodeRef = ref(null)
  const hasContentToList = computed(() => !!pagesValue.value)
  const drawerRef = ref(null)

  const { fields: pages, replace: replacePages } = useFieldArray('pages')
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

  const TYPES_PAGE = {
    PageDefault: 'Default',
    PageConnector: 'Connector'
  }

  const getTagColumnTypeStatus = (type) => {
    return {
      content: TYPES_PAGE[type],
      severity: type === 'PageDefault' ? 'info' : ''
    }
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
          data: getTagColumnTypeStatus(columnData),
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

  const updateList = (item) => {
    const idx = pages.value.findIndex((page) => page.value.code === item.code)
    if (idx !== -1) {
      pages.value[idx].value = { ...pages.value[idx].value, ...item }
    }
    if (listStatusCodeRef.value && listStatusCodeRef.value.reloadList) {
      listStatusCodeRef.value.reloadList()
    }
  }

  const actionsRow = ref([
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      type: 'action',
      commandAction: async (item) => {
        openEditStatusCodeDrawer(item)
      }
    },
    {
      label: 'Reset to default',
      icon: 'pi pi-undo',
      type: 'action',
      commandAction: async (item) => {
        const defaultItem = STATUS_CODE_OPTIONS.find((option) => option.code === item.code)
        updateList(defaultItem)
      }
    }
  ])

  const listStatusCodeService = () => {
    const mergedPages = !pagesValue.value?.length
      ? STATUS_CODE_OPTIONS
      : STATUS_CODE_OPTIONS.map((option) => ({
          ...option,
          ...pagesValue.value.find((page) => page.code === option.code),
          response: option.response
        }))

    replacePages(mergedPages)
    return pagesValue.value
  }

  const openEditStatusCodeDrawer = (item) => {
    drawerRef.value.openEditDrawer(item)
  }
</script>
