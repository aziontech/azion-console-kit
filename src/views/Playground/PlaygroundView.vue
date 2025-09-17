<template>
  <div class="flex flex-col gap-2">
    <FieldDropdownMultiSelectLazyLoader
      name="items"
      label="Select Edge Applications"
      :value="items"
      v-model="items"
      optionLabel="name"
      optionValue="id"
      :service="listServiceDecorator"
      :loadService="edgeAppService.loadEdgeApplicationService"
      :serviceParams="{ otherParam: 'value' }"
      placeholder="Edge Application items"
    />
  </div>
</template>

<script setup>
  import { watch } from 'vue'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import FieldDropdownMultiSelectLazyLoader from '@/templates/form-fields-inputs/fieldDropdownMultiSelectLazyLoader.vue'
  import { useField } from 'vee-validate'

  const { value: items } = useField('items')

  const listServiceDecorator = async (queryParams) => {
    // items.value = [1715198501, 1749470177]
    const fields = ['id', 'name', 'modules']
    return await edgeAppService.listEdgeApplicationsService({
      ...queryParams,
      fields,
      isDropdown: true
    })
  }

  watch(
    items,
    (value) => {
      console.log(value)
      console.log('*****')
    },
    { deep: true }
  )
</script>
