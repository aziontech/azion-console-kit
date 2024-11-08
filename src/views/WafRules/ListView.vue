<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="WAF Rules" />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listWafRulesService"
        :columns="getColumns"
        addButtonLabel="WAF Rule"
        createPagePath="waf/create"
        @on-before-go-to-edit="handleTrackClickToEdit"
        @on-before-go-to-add-page="handleTrackClickToCreate"
        editPagePath="waf/edit"
        @on-load-data="handleLoadData"
        :actions="actions"
        :apiFields="WAF_API_FIELDS"
        :defaultOrderingFieldName="'name'"
      />
      <EmptyResultsBlock
        v-else
        title="No WAF rules have been created"
        description="Click the button below to create your first WAF rule."
        createButtonLabel="WAF Rule"
        @click-to-create="handleTrackClickToEdit"
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
  import { ref, computed, inject } from 'vue'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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

  const handleTrackClickToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'WAF Rules'
      })
      .track()
  }

  const handleTrackClickToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'WAF Rules'
      })
      .track()
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const WAF_API_FIELDS = []

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'threatsConfiguration',
        header: 'Threat Type Configuration',
        type: 'component',
        sortField: 'threats_configuration',
        filterPath: 'threats_configuration',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        sortField: 'active',
        filterPath: 'active',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>
