<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { DataTableActionsButtons } from '@/components/list-table'
  import { computed, ref } from 'vue'
  import ListTable from '@/components/list-table'
  import { mfaService } from '@/services/v2/mfa/mfa-service'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    documentationService: {
      type: Function,
      required: true
    }
  })

  const MFA_USERS_API_FIELDS = ['id', 'name', 'confirmed', 'user_id', 'email']

  const hasContentToList = ref(true)
  const listTableRef = ref()
  const router = useRouter()

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'MFA',
      icon: 'pi pi-trash',
      service: mfaService.deleteMfaService
    }
  ]

  const csvMapper = (rowData) => {
    return {
      email: rowData.email,
      confirmed: rowData.data?.content || rowData.confirmed
    }
  }

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      sortField: 'name'
    },
    {
      field: 'email',
      header: 'Email',
      sortField: 'email',
      type: 'component',
      style: 'max-width: 300px',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'confirmed',
      header: 'Status',
      sortField: 'confirmed',
      filterPath: 'confirmed.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleNavigateToCreate = () => {
    router.push('/mfa/setup')
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Multi-Factor Authentication Management"
        description="Define and manage multi-factor authentication settings for account security."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="MFA"
            createPagePath="/mfa/setup"
            data-testid="create_MFA_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        v-if="hasContentToList"
        ref="listTableRef"
        :listService="mfaService.listMfaService"
        :columns="getColumns"
        :actions="actions"
        :enableEditClick="false"
        :apiFields="MFA_USERS_API_FIELDS"
        exportFileName="Multi-Factor Authentication Management"
        :csvMapper="csvMapper"
        :hideLastModifiedColumn="true"
        emptyListMessage="No MFA users found."
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No MFA configurations yet"
        description="Create your first MFA configuration to enhance account security."
        createButtonLabel="MFA"
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
