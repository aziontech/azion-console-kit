<script setup>
  import { ref, watch } from 'vue'
  import { RouterLink } from 'vue-router'
  import DataTable from '@aziontech/webkit/datatable'
  import Column from '@aziontech/webkit/column'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'

  defineOptions({ name: 'scoped-variables-info-table' })

  const props = defineProps({
    scopeType: {
      type: String,
      required: true
    },
    scopeId: {
      type: [String, Number],
      required: true
    }
  })

  const toast = useToast()
  const loading = ref(false)
  const variables = ref([])

  const fetchVariables = async () => {
    if (!props.scopeId) {
      variables.value = []
      return
    }

    loading.value = true

    try {
      const { body } = await variablesV6Service.list({
        scope_type: props.scopeType,
        scope_id: props.scopeId,
        skipCache: true
      })

      variables.value = (body ?? []).map((item) => ({
        id: item.id,
        key: item.key,
        value: item.value?.content ?? '',
        isSecret: !!item.value?.isSecret
      }))
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load variables',
        life: 5000
      })
    } finally {
      loading.value = false
    }
  }

  watch(() => [props.scopeType, props.scopeId], fetchVariables, { immediate: true })
</script>

<template>
  <div class="flex flex-col sm:max-w-3xl w-full gap-2">
    <div
      v-if="loading"
      class="text-sm text-color-secondary"
      data-testid="scoped-variables-info__loading"
    >
      Loading variables...
    </div>

    <div
      v-else-if="variables.length === 0"
      class="flex flex-col gap-1 text-sm"
      data-testid="scoped-variables-info__empty"
    >
      <span class="text-color-secondary">No variables scoped to this resource yet.</span>
      <RouterLink
        :to="{ name: 'list-variables' }"
        class="text-color-link hover:underline w-fit"
        data-testid="scoped-variables-info__manage-link"
      >
        Manage variables
      </RouterLink>
    </div>

    <DataTable
      v-else
      :value="variables"
      dataKey="id"
      class="w-full"
      data-testid="scoped-variables-info__table"
    >
      <Column
        field="key"
        header="Key"
        class="font-medium"
      />
      <Column
        header="Value"
        style="max-width: 320px"
      >
        <template #body="{ data }">
          <span
            class="text-color-secondary truncate block"
            :title="data.isSecret ? '' : data.value"
          >
            {{ data.value }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
