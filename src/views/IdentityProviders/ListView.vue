<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="SSO Management" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listIdentityProvidersService"
        :columns="getColumns"
        :actions="actionsRow"
        addButtonLabel="Identity Provider"
        createPagePath="identity-providers/create"
        editPagePath="identity-providers/edit"
        @on-load-data="handleLoadData"
        ref="refListTable"
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
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { listIdentityProvidersService } from '@/services/identity-providers-services'
  import {
    deleteSAMLIdentityProviderService,
    deleteOIDCIdentityProviderService
  } from '@/services/identity-providers-services'

  defineOptions({ name: 'identity-providers-view' })

  const hasContentToList = ref(true)

  const handleDeleteIdentityProvider = async (item) => {
    const deleteService =
      item.protocol === 'OIDC'
        ? deleteOIDCIdentityProviderService
        : deleteSAMLIdentityProviderService

    try {
      await deleteService(item.id)
    } catch (error) {
      console.error(error)
    }
  }
  const actionsRow = ref([
    {
      label: 'Set as active',
      type: 'action',
      icon: 'pi pi-fw pi-check-circle',
      commandAction: async (item) => {
        console.log(item)
      }
    },
    {
      label: 'Delete',
      type: 'delete',
      icon: 'pi pi-fw pi-trash',
      title: 'Payment Method',
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
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-with-tag' })
      },
      {
        field: 'protocol',
        header: 'Protocol'
      }
    ]
  })

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>
