<template>
  <DrawerBlock
    ref="drawerRef"
    :optionsStatusCode="pagesValue"
    @onSuccess="updateList"
  />
  <FormHorizontal
    :isDrawer="props.isDrawer"
    title="Page Codes"
    description="Use the Page Codes table to configure error pages by editing HTTP status codes. Click a row to open the settings panel and customize values like Response TTL, Custom Status Code, and Page Path (URI)."
    :pt="classesPt"
  >
    <template #inputs>
      <div>
        <ListTableBlock
          ref="listStatusCodeRef"
          isTabs
          v-if="hasContentToList"
          :enableEditClick="false"
          :columns="statusCodeColumns"
          :editInDrawer="openEditStatusCodeDrawer"
          :listService="listPagesCodeService"
          :actions="actionsRow"
          emptyListMessage="No status codes found."
        >
          <template #addButton>
            <PrimeButton
              icon="pi pi-plus"
              label="Custom Page Code"
              data-testid="status-code__add-button"
              @click="openCreateStatusCodeDrawer"
              class="w-full sm:w-auto"
            />
          </template>
        </ListTableBlock>
        <small class="p-error text-xs font-normal leading-tight">
          {{ errorMessage }}
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import DrawerBlock from '@/views/CustomPages/Drawer/drawerSelectStatusCode'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import ListTableBlock from '@/templates/list-table-block'
  import { ref, computed } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useField } from 'vee-validate'
  import { STATUS_CODE_OPTIONS } from '@/views/CustomPages/ConfigForm/listStatusCode'

  const listStatusCodeRef = ref(null)
  const drawerRef = ref(null)
  const hasContentToList = computed(() => !!pagesValue.value)

  const { value: pagesValue, errorMessage } = useField('pages')

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

  const defaultTag = ({ origin }) => {
    return origin === 'Azion'
      ? {
          value: 'Azion',
          severity: 'info'
        }
      : {}
  }

  const statusCodeColumns = [
    {
      field: 'code',
      header: 'Page Code',
      type: 'component',
      filterPath: 'code.value',
      sortField: 'code.value',
      component: (columnData) => {
        return columnBuilder({
          data: {
            text: columnData.value === 'default' ? 'Default' : columnData.value,
            tagProps: defaultTag(columnData)
          },
          columnAppearance: 'text-with-tag'
        })
      }
    },
    {
      field: 'uri',
      header: 'Page Path (URI)',
      type: 'component',
      filterPath: 'uri',
      sortField: 'uri',
      component: (columnData) => {
        return columnBuilder({
          data: { text: columnData || '-' },
          columnAppearance: 'text-format'
        })
      }
    },
    {
      field: 'customStatusCode',
      header: 'Custom Status',
      type: 'component',
      filterPath: 'customStatusCode',
      sortField: 'customStatusCode',
      component: (columnData) => {
        return columnBuilder({
          data: { text: columnData || '-' },
          columnAppearance: 'text-format'
        })
      }
    },
    {
      field: 'ttl',
      header: 'Response TTL',
      type: 'component',
      filterPath: 'ttl',
      sortField: 'ttl',
      component: (columnData) => {
        return columnBuilder({
          data: { text: `${columnData || '0'} (seconds)` },
          columnAppearance: 'text-format'
        })
      }
    }
  ]

  const updateList = (item) => {
    if (item.code.origin) return

    const idx = pagesValue.value.findIndex(
      (page) => page.code.value === item.code.value && !page.code.origin
    )
    if (idx !== -1) {
      pagesValue.value[idx] = { ...pagesValue.value[idx], ...item }
    } else {
      pagesValue.value.push(item)
    }

    listStatusCodeRef.value.reload()
  }

  const deletePage = (idPage) => {
    const idx = pagesValue.value.findIndex((page) => page.id === idPage)
    if (idx !== -1) {
      pagesValue.value.splice(idx, 1)
    }

    listStatusCodeRef.value.reload()
  }

  const actionsRow = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'Page Code',
      icon: 'pi pi-trash',
      disabled: (item) => item.code.origin === 'Azion',
      service: (item) => deletePage(item)
    }
  ]

  const listPagesCodeService = () => {
    const hasPages = !!pagesValue.value?.length
    if (hasPages) {
      const pagesCodes = new Set(pagesValue.value.map((page) => page.code.value))
      const filteredPages = STATUS_CODE_OPTIONS.filter((page) => !pagesCodes.has(page.code.value))
      return [...pagesValue.value, ...filteredPages]
    }

    return STATUS_CODE_OPTIONS
  }

  const openEditStatusCodeDrawer = (item) => {
    drawerRef.value.openEditDrawer(item)
  }

  const openCreateStatusCodeDrawer = () => {
    drawerRef.value.openEditDrawer({
      type: 'PageConnector',
      connector: null,
      customStatusCode: null,
      uri: null,
      ttl: null,
      statusCode: null
    })
  }
</script>
