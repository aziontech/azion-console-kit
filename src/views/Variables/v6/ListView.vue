<script setup>
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { h, computed, ref, inject } from 'vue'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'
  import { documentationCatalog } from '@/helpers'

  const tracker = inject('tracker')

  defineOptions({ name: 'variables-view' })

  const router = useRouter()
  const listTableRef = ref()

  const SCOPE_TYPE_LABELS = {
    global: 'Global',
    environment: 'Environment',
    deployment: 'Deployment',
    resource: 'Resource'
  }

  const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '—')

  const formatScope = (scope) => {
    if (!Array.isArray(scope) || !scope.length) return '—'
    const labels = scope.map((item) => SCOPE_TYPE_LABELS[item?.type] ?? capitalize(item?.type))
    return [...new Set(labels)].join(', ')
  }

  const handleNavigateToCreate = () => {
    router.push('/variables/create')
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'variable',
      icon: 'pi pi-trash',
      service: variablesV6Service.delete
    }
  ]

  const getColumns = computed(() => {
    const keyColumn = {
      field: 'key',
      header: 'Key',
      sortField: 'key',
      headerStyle: ''
    }
    const valueColumn = {
      field: 'value',
      header: 'Value',
      type: 'component',
      sortField: 'value',
      filterPath: 'value.content',
      style: 'max-width: 300px',
      component: (columnData) => {
        if (columnData.isSecret) {
          return h('span', `${columnData.content}`)
        } else {
          return columnBuilder({
            data: columnData.content,
            columnAppearance: 'text-format-with-popup',
            dependencies: {
              showCopy: true
            }
          })
        }
      }
    }
    const scopeColumn = {
      field: 'scope',
      header: 'Scope',
      type: 'component',
      disableSort: true,
      component: (data) => h('span', { 'data-testid': 'variables-list__scope' }, formatScope(data))
    }
    const lastEditorColumn = {
      field: 'lastEditor',
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor'
    }
    const lastModifiedColumn = {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'updated_at',
      filterPath: 'lastModified'
    }

    return [keyColumn, valueColumn, scopeColumn, lastEditorColumn, lastModifiedColumn]
  })

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Variable'
    })
  }

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Variable'
    })
  }
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Variables"
        description="Define and manage variables that store configuration values across Azion's products."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Variable"
            @click="handleTrackEvent"
            createPagePath="/variables/create"
            data-testid="create_Variable_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        ref="listTableRef"
        :listService="variablesV6Service.list"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/variables/edit"
        defaultOrderingFieldName="-updated_at"
        exportFileName="Variables"
        emptyListMessage="No variables found."
        :empty-block="{
          title: 'No Variables yet',
          description:
            'Create your first variable to define reusable configuration values for platform resources.',
          createButtonLabel: 'Variable',
          documentationService: documentationCatalog.variables
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-edit="handleTrackEditEvent"
        @on-before-go-to-add-page="handleTrackEvent"
      />
    </template>
  </ContentBlock>
</template>
