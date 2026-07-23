<script setup>
  import { computed, ref, inject, watch } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { getVariablesV6Columns } from '@/views/Variables/v6/variables-v6-columns'
  import { makeScopedVariablesList } from '@/views/Variables/v6/scoped-variables-list'
  import VariableScopedDrawer from '@/views/Variables/v6/Drawer/index.vue'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'
  import { documentationCatalog } from '@/helpers'

  defineOptions({ name: 'scoped-variables-tab' })

  const tracker = inject('tracker', null)

  const props = defineProps({
    scopeType: {
      type: String,
      required: true,
      validator: (value) => ['application', 'firewall'].includes(value)
    },
    scopeId: {
      type: [String, Number],
      required: true
    }
  })

  const listTableRef = ref()

  const listService = computed(() => makeScopedVariablesList(props.scopeType, props.scopeId))

  const columns = getVariablesV6Columns()

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'variable',
      icon: 'pi pi-trash',
      service: variablesV6Service.delete
    }
  ]

  const drawerVisible = ref(false)
  const editingId = ref(null)

  const openCreate = () => {
    editingId.value = null
    drawerVisible.value = true
    tracker?.product?.clickToCreate?.({ productName: 'Variable' })
  }

  const openEdit = (item) => {
    editingId.value = item.id
    drawerVisible.value = true
    tracker?.product?.clickToEdit?.({ productName: 'Variable' })
  }

  const onDrawerSuccess = () => {
    drawerVisible.value = false
    listTableRef.value?.reload?.()
  }

  watch(
    () => props.scopeId,
    () => {
      listTableRef.value?.reload?.()
    }
  )
</script>

<template>
  <div data-testid="scoped-variables-tab">
    <ListTable
      ref="listTableRef"
      :listService="listService"
      :columns="columns"
      :actions="actions"
      :editInDrawer="openEdit"
      defaultOrderingFieldName="-last_modified"
      exportFileName="Variables"
      emptyListMessage="No variables found."
      :emptyBlock="{
        title: 'No variables yet',
        description:
          'Create your first variable to define reusable configuration values for this resource.',
        createButtonLabel: 'Variable',
        documentationService: documentationCatalog.variables
      }"
      @click-to-create="openCreate"
    >
      <template #header-actions>
        <PrimeButton
          icon="pi pi-plus"
          size="small"
          label="Variable"
          outlined
          data-testid="scoped-variables-tab__create-button"
          @click="openCreate"
        />
      </template>
      <template #emptyBlockButton>
        <PrimeButton
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          label="Variable"
          data-testid="scoped-variables-tab__empty-create-button"
          @click="openCreate"
        />
      </template>
    </ListTable>

    <VariableScopedDrawer
      :scope-type="scopeType"
      :scope-id="scopeId"
      v-model:visible="drawerVisible"
      :variable-id="editingId"
      @onSuccess="onDrawerSuccess"
    />
  </div>
</template>
