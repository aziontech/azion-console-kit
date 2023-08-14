<script >
import ListTemplate from '@/templates/list-template'

export default {
  name:'home-view',
  components:{
    ListTemplate
  },
  props:{
    listEdgeApplicationsService:{
      required:true,
      type:Function,
    }
  }
}
</script>

<template>
  <ListTemplate 
    :listService="listEdgeApplicationsService"
    :columns="[
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'editor',
      header: 'Last Editor'
    },
    {
      field: 'lastEdit',
      header: 'Last Modified'
    },
    {
      field: 'origins',
      header: 'Origins'
    },
    ]"
  ></ListTemplate>
</template>

