<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from '@aziontech/webkit/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { documentationDeployProducts } from '@/helpers/azion-documentation-catalog'
  import { releaseComposerRouteFromDeployment } from '@/templates/release-composition/release-composer-route'
  import MessageCard from '@/components/MessageCard'

  defineOptions({ name: 'deployments-list-view' })

  const router = useRouter()

  const listTableRef = ref(null)

  // DeployDrawerBlock stays mounted (rollback fallback). The visible model is held
  // but the trigger now routes to the full-page composer (DS-first).
  const isDeployDrawerOpen = ref(false)
  const openRelease = () => {
    router.push(releaseComposerRouteFromDeployment())
  }

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

  const openDeploymentEdit = (deployment) => {
    if (!deployment?.id) return
    router.push({ name: 'deployments-edit', params: { id: deployment.id, tab: 'versions' } })
  }

  // Entry "from a Deployment Settings": pre-selects this DS so the composer
  // loads its full Release Composition + inherited dependencies on mount.
  const newReleaseFromDeployment = (deployment) => {
    if (!deployment?.id) return
    router.push(releaseComposerRouteFromDeployment(deployment.id))
  }

  const cloneDeployment = (deployment) => {
    if (!deployment?.id) return
    router.push({ path: '/deployments/create', query: { cloneFrom: deployment.id } })
  }

  const actions = [
    {
      type: 'action',
      label: 'New release',
      icon: 'pi pi-cloud-upload',
      commandAction: (deployment) => newReleaseFromDeployment(deployment)
    },
    {
      type: 'action',
      label: 'Edit',
      icon: 'pi pi-pencil',
      commandAction: (deployment) => openDeploymentEdit(deployment)
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
  <ContentBlock data-testid="deployments-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Deployments"
        description="View and manage your deployments. Deployment Settings are reusable across Workloads."
        data-testid="deployments-heading"
      >
        <template #default>
          <PrimeButton
            label="Deploy"
            icon="pi pi-cloud-upload"
            size="small"
            outlined
            data-testid="deployments__deploy"
            @click="openRelease"
          />
          <DataTableActionsButtons
            size="small"
            label="Deployment"
            createPagePath="/deployments/create"
            data-testid="create_Deployment_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <div class="flex flex-col gap-4">
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
          :editInDrawer="openDeploymentEdit"
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
      </div>

      <DeployDrawerBlock v-model:visible="isDeployDrawerOpen" />
    </template>
  </ContentBlock>
</template>
