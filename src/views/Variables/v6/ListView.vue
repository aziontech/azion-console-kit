<script setup>
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'
  import { getVariablesV6Columns } from '@/views/Variables/v6/variables-v6-columns'
  import { documentationCatalog } from '@/helpers'

  const tracker = inject('tracker')

  defineOptions({ name: 'variables-view' })

  const router = useRouter()
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
      service: variablesV6Service.delete
    }
  ]

  const getColumns = computed(() => getVariablesV6Columns())

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
