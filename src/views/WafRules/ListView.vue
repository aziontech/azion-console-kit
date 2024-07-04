<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="WAF Rules" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listWafRulesService"
        :columns="getColumns"
        addButtonLabel="WAF Rule"
        createPagePath="waf/create"
        editPagePath="waf/edit"
        @on-load-data="handleLoadData"
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No WAF rules have been created"
        description="Click the button below to create your first WAF rule."
        createButtonLabel="WAF Rule"
        createPagePath="waf/create"
        :documentationService="documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const props = defineProps({
    listWafRulesService: {
      required: true,
      type: Function
    },
    deleteWafRulesService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'WAF rule',
      icon: 'pi pi-trash',
      service: props.deleteWafRulesService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'threatTypes',
        header: 'Threat Type Configuration',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>
