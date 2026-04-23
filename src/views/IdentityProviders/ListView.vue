<script setup>
  import { useLoadingStore } from '@/stores/loading'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'
  import { DataTableActionsButtons } from '@/components/list-table'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { onBeforeRouteLeave } from 'vue-router'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'

  defineOptions({ name: 'identity-providers-view' })

  const props = defineProps({
    listIdentityProvidersService: Function,
    deleteSAMLIdentityProviderService: Function,
    deleteOIDCIdentityProviderService: Function,
    setIdentityProviderStatusService: Function,
    documentationService: Function
  })

  const router = useRouter()
  const loadingStore = useLoadingStore()
  const toast = useToast()
  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  const hasContentToList = ref(true)
  const listTableRef = ref(null)

  const actionsRow = [
    {
      label: 'Set as active',
      type: 'action',
      icon: 'pi pi-fw pi-check-circle',
      commandAction: (item) => setActiveIdentityProvider(item)
    },
    {
      label: 'Delete',
      type: 'action',
      icon: 'pi pi-fw pi-trash',
      visibleAction: (item) => item.id !== 'azion-default-sso' && !item.isActive,
      commandAction: async (item) => handleDeleteIdentityProvider(item)
    }
  ]

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        filterPath: 'name.text',
        sortField: 'name.text',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-with-tag' })
      },
      {
        field: 'protocol',
        header: 'Protocol'
      }
    ]
  })

  const setActiveIdentityProvider = async (item) => {
    if (item.isActive) return
    loadingStore.startLoading()
    let idpId = item.id
    let protocol = item.protocol
    if (item.id === 'azion-default-sso') {
      const currentData = listTableRef.value?.dataTableRef?.data || []
      currentData.forEach((element) => {
        if (element.isActive) {
          idpId = element.id
          protocol = element.protocol
        }
      })
    }
    try {
      const response = await props.setIdentityProviderStatusService({
        id: idpId,
        protocol,
        isActive: item.id !== 'azion-default-sso'
      })
      toastBuilder('success', response)
    } catch (error) {
      toastBuilder('error', error)
    } finally {
      listTableRef.value?.reload()
      loadingStore.finishLoading()
    }
  }

  const toastBuilder = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    toast.add(options)
  }

  const handleDeleteIdentityProvider = async (item) => {
    const deleteService =
      item.protocol === 'OIDC'
        ? props.deleteOIDCIdentityProviderService
        : props.deleteSAMLIdentityProviderService

    openDeleteDialogComposable({
      title: 'Identity Provider',
      id: item.id,
      data: item,
      deleteService: deleteService,
      closeCallback: (opt) => opt.data.updated && listTableRef.value?.reload()
    })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleNavigateToCreate = () => {
    router.push('identity-providers/create')
  }

  const handleEditRedirect = (item) => {
    router.push({ path: `identity-providers/edit/${item.protocol}/${item.id}` })
  }

  onBeforeRouteLeave((to, from, next) => {
    if (to.params.id === 'azion-default-sso') {
      return next(false)
    }
    return next(true)
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="SSO Management"
        description="Manage identity providers for single sign-on authentication."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Identity Provider"
            createPagePath="identity-providers/create"
            data-testid="create_IdentityProvider_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        v-if="hasContentToList"
        ref="listTableRef"
        :listService="props.listIdentityProvidersService"
        :columns="getColumns"
        :actions="actionsRow"
        :enableEditClick="false"
        :editInDrawer="handleEditRedirect"
        exportFileName="Identity Providers"
        emptyListMessage="No identity providers found."
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No Identity Provider yet"
        description="Create your first identity provider to enable single sign-on authentication."
        createButtonLabel="Identity Provider"
        @click-to-create="handleNavigateToCreate"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
