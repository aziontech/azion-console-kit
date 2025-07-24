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
        <InlineMessage
          class="p-2"
          name="pages"
          severity="error"
          v-if="errorMessage"
        >
          {{ errorMessage }}
        </InlineMessage>
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
              :disabled="disabledButtonAdd"
              class="w-full sm:w-auto"
            />
          </template>
        </ListTableBlock>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import DrawerBlock from '@/views/CustomPages/Drawer/drawerSelectPageCode'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import ListTableBlock from '@/templates/list-table-block'
  import { ref, computed } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { useField, useFieldArray } from 'vee-validate'
  import { STATUS_CODE_OPTIONS } from '@/views/CustomPages/Config/listStatusCode'
  import InlineMessage from 'primevue/inlinemessage'

  const listStatusCodeRef = ref(null)
  const drawerRef = ref(null)
  const hasContentToList = computed(() => !!pagesValue.value)

  const { value: pagesValue, errorMessage, handleReset } = useField('pages')
  const {
    fields: pagesArray,
    push: pushPages,
    update: updatePages,
    remove: removePages
  } = useFieldArray('pages')

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const NUMBER_MAX_PAGES = 23

  const disabledButtonAdd = computed(
    () => !!pagesValue.value?.length && pagesValue.value.length >= NUMBER_MAX_PAGES
  )

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
    handleReset()
    if (item.code.origin) return

    const idx = pagesArray.value.findIndex(
      ({ value: page }) => page.code.value === item.code.value && !page.code.origin
    )
    if (idx !== -1) {
      updatePages(idx, { ...item })
    } else {
      pushPages(item)
    }

    listStatusCodeRef.value.reload()
  }

  const deletePage = (idPage) => {
    const idx = pagesArray.value.findIndex(({ value: page }) => page.id === idPage)
    if (idx !== -1) {
      removePages(idx)
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
      type: 'page_connector',
      connector: null,
      customStatusCode: null,
      uri: null,
      ttl: 0,
      statusCode: null
    })
  }
</script>
