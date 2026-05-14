<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { environmentService } from '@/services/v2/environment/environment-service'

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

  const router = useRouter()
  const listTableRef = ref(null)
  const createPath = '/environments/create'
  const editPagePath = '/environments/edit'

  const formatDeploymentPolicyTag = (policy = 'single_version') => {
    const policyValue = typeof policy === 'string' ? policy.toLowerCase() : 'single_version'

    if (policyValue === 'versioned_urls') {
      return { content: 'Versioned URL', severity: 'secondary' }
    }

    return { content: 'Single Version', severity: 'primary' }
  }

  const handleNavigateToCreate = () => {
    router.push(createPath)
  }

  const handleNavigateToEdit = (environment) => {
    router.push({ name: 'edit-environment', params: { id: environment.id } })
  }

  const actions = [
    {
      type: 'action',
      label: 'Edit',
      icon: 'pi pi-pencil',
      commandAction: (item) => handleNavigateToEdit(item)
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'Environment',
      icon: 'pi pi-trash',
      service: environmentService.deleteEnvironmentService
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
        field: 'deployment_version_policy',
        header: 'Configuration',
        sortField: 'deployment_version_policy',
        filterPath: 'deployment_version_policy',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: formatDeploymentPolicyTag(columnData),
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'last_editor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor'
      },
      {
        field: 'updated_at',
        header: 'Last Modified',
        sortField: 'updated_at',
        filterPath: 'updated_at'
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
      count: result.count,
      body: result.body
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
            :createPagePath="createPath"
            @click="handleNavigateToCreate"
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
        :editPagePath="editPagePath"
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
        @click-to-create="handleNavigateToCreate"
      />
    </template>
  </ContentBlock>
</template>
