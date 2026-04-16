<script setup>
  import { onBeforeRouteLeave, useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { h, computed, ref, inject } from 'vue'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { variablesService } from '@/services/v2/variables'
  import { documentationCatalog } from '@/helpers'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'variables-view' })

  const router = useRouter()
  const enableRedirect = ref(true)
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('/variables/create')
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'variable',
      icon: 'pi pi-trash',
      service: variablesService.delete
    }
  ]

  const getColumns = computed(() => {
    return [
      {
        field: 'key',
        header: 'Key',
        headerStyle: ''
      },
      {
        field: 'value',
        header: 'Value',
        type: 'component',
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
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified'
      }
    ]
  })

  const checkIfIsEditable = (item) => {
    tracker.product.clickToEdit({
      productName: 'Variable'
    })
    enableRedirect.value = !item.value.isSecret
  }

  onBeforeRouteLeave((to, from, next) => {
    if (enableRedirect.value) {
      return next()
    }
    enableRedirect.value = true
    return next(false)
  })

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
        :listService="variablesService.list"
        :columns="getColumns"
        :actions="actions"
        :frozenColumns="['key']"
        editPagePath="/variables/edit"
        exportFileName="Variables"
        :lazy="false"
        emptyListMessage="No variables found."
        :empty-block="{
          title: 'No Variables yet',
          description:
            'Create your first variable to define reusable configuration values for platform resources.',
          createButtonLabel: 'Variable',
          documentationService: documentationCatalog.variables
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-edit="checkIfIsEditable"
        @on-before-go-to-add-page="handleTrackEvent"
      />
    </template>
  </ContentBlock>
</template>
