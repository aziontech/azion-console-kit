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
            @click="openCreateStatusCodeDrawer"
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

  const { fields: pages, replace: replacePages, remove: removePage } = useFieldArray('pages')
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

  const defaultTag = ({ origin }) => {
    return origin === 'Azion'
      ? {
          value: 'Azion',
          severity: 'info'
        }
      : {}
  }

  const loaderStatusCodeColumns = [
    {
      field: 'code',
      header: 'Page Code',
      type: 'component',
      filterPath: 'code.value',
      sortField: 'code.value',
      component: (columnData) => {
        return columnBuilder({
          data: {
            text: columnData.value,
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
    const idx = pages.value.findIndex((page) => page.value.code === item.code)
    if (idx !== -1) {
      pages.value[idx].value = { ...pages.value[idx].value, ...item }
    }
  }

  const deletePage = (idPage) => {
    const idx = pages.value.findIndex((page) => page.value.id === idPage)
    if (idx !== -1) removePage(idx)
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

  const listStatusCodeService = () => {
    const onMountedStart = pagesValue.value.find((page) => page.code.origin === 'Azion')
    if (onMountedStart) {
      replacePages(pagesValue.value)
      return pagesValue.value
    }
    const mergePagesDefault = [...pagesValue.value, ...STATUS_CODE_OPTIONS]
    replacePages(mergePagesDefault)
    return mergePagesDefault
  }

  const openEditStatusCodeDrawer = (item) => {
    drawerRef.value.openEditDrawer(item)
  }

  const openCreateStatusCodeDrawer = () => {
    drawerRef.value.openEditDrawer({})
  }
</script>
