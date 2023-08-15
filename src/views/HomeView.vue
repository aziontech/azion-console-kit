<script >
import ListTemplate from '@/templates/list-template'

export default {
  name: 'home-view',
  components: {
    ListTemplate
  },
  props: {
    listEdgeApplicationsService: {
      required: true,
      type: Function,
    },
    deleteEdgeApplicationService: {
      required: true,
      type: Function,
    }
  }
}
</script>

<template>
  <ListTemplate :pageTitle="'Edge Applications'" :addButtonLabel="'Add Edge Application'" :createPagePath="'/'"
    :listService="listEdgeApplicationsService" :deleteService="deleteEdgeApplicationService" :columns="[
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModify',
        header: 'Last Modified'
      },
      {
        field: 'active',
        header: 'Active'
      },
      {
        field: 'debugRules',
        header: 'Debug rules'
      },
      {
        field: 'origins',
        header: 'Origins'
      },
    ]"></ListTemplate>
</template>

