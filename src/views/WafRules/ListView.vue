<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="WAF Rules" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listWafRulesService"
        :deleteService="props.deleteWafRulesService"
        :columns="getColumns"
        pageTitleDelete="WAF Rules"
        addButtonLabel="WAF Rules"
        createPagePath="waf/create"
        editPagePath="waf/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No waf rules added"
        description="Create your first waf rules."
        createButtonLabel="WAF Rules"
        createPagePath="waf/create"
        :documentationService="props.documentationService"
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
