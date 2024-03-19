<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Purge"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listRealTimePurgeService"
        :columns="getColumns"
        addButtonLabel="Purge"
        createPagePath="real-time-purge/create"
        @on-load-data="handleLoadData"
        :isGraphql="true"
        :enableEditClick="false"
        emptyListMessage="No purge found."
      >
      </ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No purges have been added"
        description="Click the button below to add your first purge."
        createButtonLabel="Purge"
        createPagePath="real-time-purge/create"
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
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'

  const props = defineProps({
    listRealTimePurgeService: { required: true, type: Function },
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
        field: 'time',
        header: 'Date'
      },
      {
        field: 'user',
        header: 'User'
      },
      {
        field: 'layer',
        header: 'Layer'
      },
      {
        field: 'type',
        header: 'Type'
      },
      {
        field: 'arguments',
        header: 'Arguments'
      }
    ]
  })
</script>
