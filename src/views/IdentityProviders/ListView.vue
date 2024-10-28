<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="SSO Management" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        ref="refListTable"
        :listService="listIdentityProvidersService"
        :columns="getColumns"
        :actions="actionsRow"
        addButtonLabel="Identity Provider"
        createPagePath="identity-providers/create"
        @on-load-data="handleLoadData"
        @on-row-click-edit-redirect="handleEditRedirect"
        enableEditCustomRedirect
        emptyListMessage="No identity providers found."
      />
      <EmptyResultsBlock
        v-else
        title="No identity providers has been created"
        description="Click the button below to create your first identity provider."
        createButtonLabel="Identity Provider"
        createPagePath="identity-providers/create"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useLoadingStore } from '@/stores/loading'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import DeleteDialog from '@/templates/list-table-block/dialog/delete-dialog.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { onBeforeRouteLeave } from 'vue-router'
  import { useDialog } from 'primevue/usedialog'
  defineOptions({ name: 'identity-providers-view' })

  const props = defineProps({
    listIdentityProvidersService: Function,
    deleteSAMLIdentityProviderService: Function,
    deleteOIDCIdentityProviderService: Function,
    setIdentityProviderStatusService: Function
  })

  const router = useRouter()

  const loadingStore = useLoadingStore()
  const toast = useToast()
  const dialog = useDialog()

  const hasContentToList = ref(true)
  const refListTable = ref(null)
  const actionsRow = ref([
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
  ])

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
      refListTable.value.data.forEach((element) => {
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
      reload()
      loadingStore.finishLoading()
    }
  }

  const reload = () => {
    refListTable.value.reload()
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

  const openDialog = (dialogComponent, body) => {
    dialog.open(dialogComponent, body)
  }

  const handleDeleteIdentityProvider = async (item) => {
    const deleteService =
      item.protocol === 'OIDC'
        ? props.deleteOIDCIdentityProviderService
        : props.deleteSAMLIdentityProviderService

    const bodyDelete = {
      data: {
        title: 'Identity Provider',
        selectedID: item.id,
        selectedItemData: item,
        deleteDialogVisible: true,
        deleteService: deleteService,
        rerender: Math.random()
      },
      onClose: (opt) => opt.data.updated && reload()
    }
    openDialog(DeleteDialog, bodyDelete)
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
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
