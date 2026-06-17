<script setup>
  import { computed, ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'
  import EnvironmentDrawer from './Drawer/EnvironmentDrawer.vue'

  defineOptions({ name: 'list-environments' })

  const props = defineProps({
    listEnvironmentsService: {
      required: true,
      type: Function
    },
    documentationService: {
      type: Function,
      required: false
    }
  })

  const listTableRef = ref(null)
  const drawerRef = ref(null)
  const isEditing = ref(false)
  const selectedEnvironment = ref(null)

  const handleOpenCreateDrawer = () => {
    isEditing.value = false
    selectedEnvironment.value = null
    drawerRef.value?.open()
  }

  const handleOpenEditDrawer = (environment) => {
    isEditing.value = true
    selectedEnvironment.value = environment
    drawerRef.value?.open()
  }

  const handleDrawerSave = () => {
    listTableRef.value?.reload()
  }

  const actions = [
    {
      type: 'action',
      label: 'Edit',
      icon: 'pi pi-pencil',
      commandAction: (item) => handleOpenEditDrawer(item)
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'Environment',
      icon: 'pi pi-trash',
      service: async (id) => {
        const { deleteEnvironmentService } =
          await import('@/services/v2/environment/environment-mock')
        return deleteEnvironmentService(id)
      }
    }
  ]

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        sortField: 'name',
        filterPath: 'name'
      },
      {
        field: 'status',
        header: 'Status',
        sortField: 'status',
        filterPath: 'status',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'configuration',
        header: 'Configuration',
        sortField: 'configuration',
        filterPath: 'configuration',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'url',
        header: 'URL',
        sortField: 'url',
        filterPath: 'url'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'lastEditor',
        filterPath: 'lastEditor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified'
      }
    ]
  })

  const frozenColumns = ['name']

  const allowedFilters = computed(() => {
    return getColumns.value
  })

  const listServiceAdapter = async (params) => {
    const result = await props.listEnvironmentsService(params)
    return {
      count: result.total,
      body: result.data
    }
  }
</script>

<template>
  <ContentBlock data-testid="environments-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Environments"
        description="Manage deploy environments for your applications."
        data-testid="environments-heading"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Environment"
            @click="handleOpenCreateDrawer"
            data-testid="create_Environment_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        ref="listTableRef"
        :listService="listServiceAdapter"
        :columns="getColumns"
        :actions="actions"
        :enableEditClick="true"
        :editInDrawer="handleOpenEditDrawer"
        defaultOrderingFieldName="name"
        exportFileName="Environments"
        :lazy="false"
        :frozenColumns="frozenColumns"
        :allowedFilters="allowedFilters"
        emptyListMessage="No environments found."
        :emptyBlock="{
          title: 'No Environments yet',
          description: 'Create your first environment to manage your deployment stages.',
          createButtonLabel: 'Environment',
          documentationService: props.documentationService,
          emptyListMessage: 'No Environments found.'
        }"
        @click-to-create="handleOpenCreateDrawer"
      />
    </template>
  </ContentBlock>

  <EnvironmentDrawer
    ref="drawerRef"
    :isEditing="isEditing"
    :environment="selectedEnvironment"
    @save="handleDrawerSave"
  />
</template>
