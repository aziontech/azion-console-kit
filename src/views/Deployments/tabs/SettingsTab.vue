<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { documentationDeployProducts } from '@/helpers/azion-documentation-catalog'
  import MessageCard from '@/components/MessageCard'
  import DeploymentDrawer from '@/views/Deployments/components/DeploymentDrawer.vue'

  defineOptions({ name: 'deployments-settings-tab' })

  const router = useRouter()

  const listTableRef = ref(null)

  const drawerVisible = ref(false)
  const selectedDeploymentId = ref(null)
  const drawerInitialTab = ref('versions')

  const columns = computed(() => [
    { field: 'name', header: 'Name', sortField: 'name', filterPath: 'name' },
    {
      field: 'policyLabel',
      header: 'Policy',
      disableSort: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: { content: columnData || '-', severity: 'info' },
          columnAppearance: 'tag'
        })
    },
    { field: 'lastModified', header: 'Last Modified', sortField: 'created_at' },
    { field: 'lastEditor', header: 'Last Editor', disableSort: true }
  ])

  const frozenColumns = ['name']

  const allowedFilters = computed(() => [
    { field: 'name', header: 'Name', filterPath: 'name' },
    { field: 'id', header: 'ID', filterPath: 'id' },
    { field: 'policy', header: 'Policy' },
    { field: 'state', header: 'Status' },
    { field: 'last_editor', header: 'Last Editor' }
  ])

  const reloadList = () => {
    listTableRef.value?.reload()
  }

  const openDeploymentDrawer = (deployment, tab = 'versions') => {
    if (!deployment?.id) return
    selectedDeploymentId.value = deployment.id
    drawerInitialTab.value = tab
    drawerVisible.value = true
  }

  const cloneDeployment = (deployment) => {
    if (!deployment?.id) return
    router.push({ path: '/deployments/create', query: { cloneFrom: deployment.id } })
  }

  const editInDrawer = (deployment) => openDeploymentDrawer(deployment, 'versions')

  const actions = [
    {
      type: 'action',
      label: 'Edit',
      icon: 'pi pi-pencil',
      commandAction: (deployment) => openDeploymentDrawer(deployment, 'settings')
    },
    {
      type: 'action',
      label: 'Clone',
      icon: 'pi pi-copy',
      commandAction: (deployment) => cloneDeployment(deployment)
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'Deployment',
      icon: 'pi pi-trash',
      service: deploymentService.deleteDeploymentService
    }
  ]
</script>

<template>
  <div class="flex flex-col gap-4 mt-4">
    <MessageCard
      type="info"
      title="Deployment Settings are reusable across Workloads"
      description="Create and manage deployment configurations once, then apply them to multiple workloads and environments."
      data-testid="deployments-overview__notice"
    />

    <ListTable
      ref="listTableRef"
      :listService="deploymentService.listDeploymentsService"
      :columns="columns"
      :frozenColumns="frozenColumns"
      :allowedFilters="allowedFilters"
      :actions="actions"
      :editInDrawer="editInDrawer"
      :lazy="true"
      :hideLastModifiedColumn="true"
      defaultOrderingFieldName="created_at"
      emptyListMessage="No deployments found."
      :emptyBlock="{
        title: 'No Deployment Settings found',
        description:
          'Create a new deployment configuration or reuse an existing one across your workloads.',
        documentationService: documentationDeployProducts.deployments,
        emptyListMessage: 'No deployments found.'
      }"
    />

    <DeploymentDrawer
      v-if="drawerVisible"
      :key="selectedDeploymentId"
      v-model:visible="drawerVisible"
      :deploymentId="selectedDeploymentId"
      :initialTab="drawerInitialTab"
      @saved="reloadList"
    />
  </div>
</template>
